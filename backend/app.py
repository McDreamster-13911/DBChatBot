from flask import Flask, request, jsonify
import requests
import asyncpg
import asyncio
import os
from dotenv import load_dotenv
from flask_cors import CORS
import threading
import openai

# Loading environment variables
load_dotenv("../.env")

app = Flask(__name__)
CORS(app)

# Hugging Face API Config (if used elsewhere)
HF_API_KEY = os.getenv("HF_API_KEY")
MODEL = os.getenv("MODEL")  # for HF inference, not used for OpenAI
API_URL = f"https://api-inference.huggingface.co/models/{MODEL}"
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

# OpenAI API config
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY
# Ensure no environment variable is overriding our model choice:
os.environ["OPENAI_MODEL"] = "gpt-3.5-turbo"

# Database Config for asyncpg
DATABASE_URL = os.getenv("DATABASE_URL")

# Background event loop and connection pool setup
background_loop = asyncio.new_event_loop()
pool = None

def start_background_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

bg_thread = threading.Thread(target=start_background_loop, args=(background_loop,), daemon=True)
bg_thread.start()

async def init_pool():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL)

asyncio.run_coroutine_threadsafe(init_pool(), background_loop).result()

# Database operations using asyncpg
async def insert_data(table_name, column_names, values):
    sql = f"INSERT INTO {table_name}({', '.join(column_names)}) VALUES({', '.join(['$' + str(i+1) for i in range(len(values))])}) RETURNING id;"
    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *values)
        return row[0] if row else None

async def fetch_data(query, *params):
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

@app.route("/suppliers", methods=["POST"])
def add_supplier():
    data = request.json
    name = data.get("name")
    contact_info = data.get("contact_info")
    product_category = data.get("product_category")
    
    if not all([name, contact_info, product_category]):
        return jsonify({"error": "Missing required fields"}), 400
    
    future = asyncio.run_coroutine_threadsafe(
        insert_data("suppliers", ["name", "contact_info", "product_category"], [name, contact_info, product_category]),
        background_loop
    )
    supplier_id = future.result()
    return jsonify({"supplier_id": supplier_id})

@app.route("/suppliers", methods=["GET"])
def get_suppliers():
    future = asyncio.run_coroutine_threadsafe(
        fetch_data("SELECT * FROM suppliers"), 
        background_loop
    )
    suppliers = future.result()
    return jsonify(suppliers)

@app.route("/products", methods=["POST"])
def add_product():
    data = request.json
    name = data.get("name")
    brand = data.get("brand")
    price = data.get("price")
    category = data.get("category")
    description = data.get("description")
    supplier_id = data.get("supplier_id")
    
    try:
        price = float(price)
        supplier_id = int(supplier_id)
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    
    if not all([name, brand, category, description]):
        return jsonify({"error": "Missing required text fields"}), 400
    
    future = asyncio.run_coroutine_threadsafe(
        insert_data("products", ["name", "brand", "price", "category", "description", "supplier_id"],
                    [name, brand, price, category, description, supplier_id]),
        background_loop
    )
    product_id = future.result()
    return jsonify({"product_id": product_id})

@app.route("/products", methods=["GET"])
def get_products():
    future = asyncio.run_coroutine_threadsafe(
        fetch_data("SELECT * FROM products"), 
        background_loop
    )
    products = future.result()
    return jsonify(products)

@app.route("/chat", methods=["POST"])
def chat_handler():
    try:
        data = request.json
        user_input = data.get("inputs", data.get("message", ""))
        if not user_input:
            return jsonify({"error": "No input provided"}), 400

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or "gpt-4" if available
            messages=[{"role": "user", "content": user_input}],
            max_tokens=512
        )

        generated_text = response.choices[0].message['content']
        return jsonify({
            "status": "success",
            "user_query": user_input,
            "chatbot_response": generated_text
        })
    except Exception as e:
        return jsonify({"error": f"OpenAI API Error: {str(e)}"}), 500

# LangGraph SQL Agent Integration

from langgraph.graph import StateGraph, START, END
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

# Creating a SQLDatabase instance for LangGraph
db_langgraph = SQLDatabase.from_uri(DATABASE_URL)

# Building a toolkit with SQL tools;
toolkit = SQLDatabaseToolkit(db=db_langgraph, llm=ChatOpenAI(model="gpt-3.5-turbo", temperature=0))
tools = toolkit.get_tools()
list_tables_tool = next(tool for tool in tools if tool.name == "sql_db_list_tables")
get_schema_tool = next(tool for tool in tools if tool.name == "sql_db_schema")

# Defining a tool to execute SQL queries
@tool
def db_query_tool(query: str) -> str:
    """
    Execute a SQL query against the database.
    If the query fails, return an error message.
    """
    result = db_langgraph.run_no_throw(query)
    if not result:
        return "Error: Query failed. Please rewrite your query and try again."
    return result

# Defining the state type for our workflow
class State(TypedDict):
    messages: list


def first_tool_call(state: State) -> dict:
    return {
        "messages": [
            {
                "role": "assistant",
                "content": "",
                "tool_calls": [{"name": "sql_db_list_tables", "args": {}, "tool_call_id": "tool_abcd123"}]
            }
        ]
    }


def list_tables_node(state: State) -> dict:
    output = list_tables_tool.invoke("")
    return {
        "messages": [
            {
                "role": "tool",
                "content": output,
                "tool_call_id": "tool_abcd123",
                "name": "sql_db_list_tables"
            }
        ]
    }


def model_get_schema_node(state: State) -> dict:
    # Ensure we use "gpt-4" here as well.
    model_get_schema = ChatOpenAI(model="gpt-3.5-turbo", temperature=0).bind_tools([get_schema_tool])
    response = model_get_schema.invoke(state["messages"])
    return {"messages": [response]}

def query_gen_node(state: State) -> dict:
    # Assume schema is in the second-to-last message and question in the first message.
    schema = state["messages"][-2]["content"] if len(state["messages"]) >= 2 else ""
    question = state["messages"][0]["content"]
    query_gen_system = (
        f"You are a SQL expert. Given the following schema:\n{schema}\n\n"
        f"Generate a SQL query to answer: {question}\n"
        "Limit the results to at most 5 rows. Output only the SQL query."
    )
    query_gen_prompt = ChatPromptTemplate.from_messages(
        [("system", query_gen_system), ("user", "{messages}")]
    )
    query_gen = query_gen_prompt | ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    message = query_gen.invoke(state)
    return {"messages": [message]}

# Node: Check the generated query for common mistakes
def model_check_query(state: State) -> dict:
    query_check_system = (
        "Double-check the following SQL query for common mistakes. "
        "If there are mistakes, rewrite the query; otherwise, return it unchanged."
    )
    query_check_prompt = ChatPromptTemplate.from_messages(
        [("system", query_check_system), ("placeholder", "{messages}")]
    )
    query_check = query_check_prompt | ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    message = query_check.invoke({"messages": [state["messages"][-1]]})
    return {"messages": [message]}

# Node: Execute the generated SQL query
def execute_query_node(state: State) -> dict:
    sql_query = state["messages"][-1].get("content", "")
    try:
        result = db_langgraph.run(sql_query)
        return {
            "messages": [
                {
                    "role": "tool",
                    "content": str(result),
                    "tool_calls": [{"name": "db_query_tool", "args": {"final_answer": str(result)}, "tool_call_id": "final_exec"}]
                }
            ]
        }
    except Exception as e:
        return {
            "messages": [
                {
                    "role": "tool",
                    "content": f"Error executing query: {str(e)}",
                    "tool_calls": [{"name": "db_query_tool", "args": {"final_answer": f"Error executing query: {str(e)}"}, "tool_call_id": "final_exec"}]
                }
            ]
        }

# Conditional edge: decide whether to re-check or stop
def should_continue(state: State) -> str:
    last_msg = state["messages"][-1]
    if isinstance(last_msg, dict) and last_msg.get("tool_calls"):
        return END
    if isinstance(last_msg, dict) and last_msg.get("content", "").startswith("Error:"):
        return "query_gen"
    return "model_check_query"

# Build the workflow
workflow = StateGraph(State)
workflow.add_node("first_tool_call", first_tool_call)
workflow.add_node("list_tables_node", list_tables_node)
workflow.add_node("model_get_schema_node", model_get_schema_node)
workflow.add_node("query_gen", query_gen_node)
workflow.add_node("model_check_query", model_check_query)
workflow.add_node("execute_query", execute_query_node)

workflow.set_entry_point("first_tool_call")
workflow.add_edge("first_tool_call", "list_tables_node")
workflow.add_edge("list_tables_node", "model_get_schema_node")
workflow.add_edge("model_get_schema_node", "query_gen")
workflow.add_conditional_edges("query_gen", should_continue)
workflow.add_edge("model_check_query", "execute_query")
workflow.add_edge("execute_query", END)

# Compile the workflow
sql_agent_workflow = workflow.compile()

@app.route("/sql-agent", methods=["POST"])
def sql_agent():
    data = request.json
    user_question = data.get("question")
    if not user_question:
        return jsonify({"error": "No question provided"}), 400

    # Initialize state with a user message as a dict
    state = {"messages": [{"role": "user", "content": user_question}]}
    result_state = sql_agent_workflow.invoke(state)

    try:
        final_answer = result_state["messages"][-1]["tool_calls"][0]["args"]["final_answer"]
    except Exception:
        final_answer = result_state["messages"][-1].get("content", "Error extracting final answer.")
    return jsonify({"final_answer": final_answer})



@app.route('/')
def hello_world():
    return 'Hello World'

if __name__ == '__main__':
    app.run(debug=True)
