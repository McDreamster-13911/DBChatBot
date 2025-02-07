class Supplier:
    def __init__(self, name, contact_info, product_category):
        self.name = name
        self.contact_info = contact_info
        self.product_category = product_category

class Product:
    def __init__(self, name, brand, price, category, description, supplier_id):
        self.name = name
        self.brand = brand
        self.price = price
        self.category = category
        self.description = description
        self.supplier_id = supplier_id
