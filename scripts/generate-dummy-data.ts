import { DatabaseService } from "@/lib/database"

const db = DatabaseService.getInstance()

// Generate 100+ dummy data entries across all entities
function generateDummyData() {
  console.log("[v0] Starting dummy data generation...")

  // Generate 25 customers
  const customerNames = [
    "John Smith",
    "Sarah Johnson",
    "Michael Brown",
    "Emily Davis",
    "David Wilson",
    "Lisa Anderson",
    "Robert Taylor",
    "Jennifer Martinez",
    "William Garcia",
    "Jessica Rodriguez",
    "James Lopez",
    "Ashley Hernandez",
    "Christopher Young",
    "Amanda King",
    "Matthew Wright",
    "Stephanie Green",
    "Daniel Adams",
    "Michelle Baker",
    "Anthony Nelson",
    "Kimberly Hill",
    "Mark Campbell",
    "Laura Mitchell",
    "Steven Roberts",
    "Donna Carter",
    "Kevin Phillips",
  ]

  const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "company.com"]
  const cities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
    "Dallas",
    "San Jose",
  ]
  const brands = ["Dell", "HP", "Lenovo", "Apple", "ASUS"]

  customerNames.forEach((name, index) => {
    const firstName = name.split(" ")[0].toLowerCase()
    const lastName = name.split(" ")[1].toLowerCase()
    const email = `${firstName}.${lastName}@${domains[index % domains.length]}`
    const phone = `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`
    const city = cities[index % cities.length]
    const address = `${Math.floor(Math.random() * 9999 + 1)} ${["Main St", "Oak Ave", "Pine Rd", "Elm Dr", "Cedar Ln"][index % 5]}, ${city}`
    const preferredBrands = brands.slice(0, Math.floor(Math.random() * 3) + 1).join(", ")
    const notes = [
      "Prefers gaming laptops with high-end graphics",
      "Budget-conscious, looks for deals and discounts",
      "Business user, needs reliable and professional models",
      "Student, requires lightweight and portable options",
      "Creative professional, needs high-resolution displays",
      "Frequent traveler, values battery life and durability",
      "Tech enthusiast, interested in latest specifications",
      "Home user, basic computing needs",
      "Small business owner, bulk purchase potential",
      "Repeat customer, excellent payment history",
    ][index % 10]

    db.addCustomer({
      name,
      email,
      phone,
      address,
      preferred_brands: preferredBrands,
      notes,
    })
  })

  // Generate 30 laptops with varied specifications
  const laptopModels = [
    { brand: "Dell", models: ["XPS 13", "Inspiron 15", "Latitude 7420", "Alienware m15", "Vostro 14"] },
    { brand: "HP", models: ["Pavilion 15", "EliteBook 840", "Spectre x360", "Omen 17", "ProBook 450"] },
    { brand: "Lenovo", models: ["ThinkPad X1", "IdeaPad 5", "Legion 5", "Yoga 7i", "ThinkBook 14"] },
    { brand: "Apple", models: ["MacBook Air M2", 'MacBook Pro 14"', 'MacBook Pro 16"', "MacBook Air M1", 'iMac 24"'] },
    { brand: "ASUS", models: ["ZenBook 14", "ROG Strix G15", "VivoBook S15", "TUF Gaming A15", "ExpertBook B9"] },
  ]

  const processors = [
    "Intel i5-12400H",
    "Intel i7-12700H",
    "AMD Ryzen 5 5600H",
    "AMD Ryzen 7 5800H",
    "Apple M1",
    "Apple M2",
  ]
  const ramOptions = [8, 16, 32]
  const storageOptions = [256, 512, 1024]
  const categories = ["Business", "Gaming", "Ultrabook", "Workstation", "Budget"]

  laptopModels.forEach((brandData) => {
    brandData.models.forEach((model, modelIndex) => {
      const processor = processors[Math.floor(Math.random() * processors.length)]
      const ram = ramOptions[Math.floor(Math.random() * ramOptions.length)]
      const storage = storageOptions[Math.floor(Math.random() * storageOptions.length)]
      const category = categories[Math.floor(Math.random() * categories.length)]
      const basePrice = Math.floor(Math.random() * 2000 + 500)
      const costPrice = Math.floor(basePrice * 0.7)
      const quantity = Math.floor(Math.random() * 50 + 5)
      const serialNumber = `${brandData.brand.substring(0, 2).toUpperCase()}${Date.now().toString().slice(-6)}${modelIndex}`

      db.addLaptop({
        brand: brandData.brand,
        model,
        processor,
        ram,
        storage,
        price: basePrice,
        cost_price: costPrice,
        quantity,
        category,
        supplier: `${brandData.brand} Official Distributor`,
        serial_number: serialNumber,
        warranty_period: 12,
        low_stock_threshold: 5,
      })
    })
  })

  // Generate 35 sales records
  const customers = db.getCustomers()
  const laptops = db.getLaptops()
  const paymentMethods = ["cash", "card", "installment", "bank_transfer"]
  const statuses = ["completed", "pending", "cancelled"]

  for (let i = 0; i < 35; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const laptop = laptops[Math.floor(Math.random() * laptops.length)]
    const quantity = Math.floor(Math.random() * 3) + 1
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const saleDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000))
    const warrantyExpiry = new Date(saleDate.getTime() + laptop.warranty_period * 30 * 24 * 60 * 60 * 1000)

    db.addSale({
      laptop_id: laptop.id,
      customer_id: customer.id,
      quantity,
      unit_price: laptop.price,
      total_amount: laptop.price * quantity,
      payment_method: paymentMethod,
      status,
      sale_date: saleDate.toISOString(),
      warranty_expiry: warrantyExpiry.toISOString(),
    })
  }

  // Generate 15 suppliers
  const supplierNames = [
    "Tech Distributors Inc",
    "Global Electronics Supply",
    "Premium Computer Parts",
    "Digital Solutions Ltd",
    "Hardware Express Co",
    "Elite Tech Suppliers",
    "Mega Electronics Hub",
    "Professional IT Supply",
    "Advanced Tech Distribution",
    "Computer World Wholesale",
    "Tech Innovation Supply",
    "Digital Hardware Co",
    "Electronics Plus Distribution",
    "IT Solutions Supply",
    "Modern Tech Distributors",
  ]

  supplierNames.forEach((name, index) => {
    const email = `contact@${name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "")}.com`
    const phone = `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`
    const address = `${Math.floor(Math.random() * 999 + 100)} Industrial Blvd, ${cities[index % cities.length]}`

    db.addSupplier({
      name,
      contact_person: `Manager ${index + 1}`,
      email,
      phone,
      address,
    })
  })

  console.log("[v0] Dummy data generation completed!")
  console.log(`Generated: ${customers.length} customers, ${laptops.length} laptops, 35 sales, 15 suppliers`)
}

// Run the dummy data generation
generateDummyData()
