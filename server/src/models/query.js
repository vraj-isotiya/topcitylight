import { pool } from "../db/index.js";

const createTables = async () => {
  try {
    // Enable UUID generation
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Create or replace trigger function to auto-update updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create Users Table
    const userQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        refresh_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Customers Table
    const customerQuery = `
     CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE,
    phone VARCHAR,
    company VARCHAR,
    address VARCHAR,
    country VARCHAR,
    province VARCHAR,
    city VARCHAR,
    postal_code VARCHAR,
    fax VARCHAR,
    bank_name VARCHAR,
    bank_account VARCHAR,
    website VARCHAR,
    contact_person_name VARCHAR,
    contact_person_email VARCHAR,
    notes VARCHAR,
    status VARCHAR(20) CHECK (status IN ('Lead', 'Prospect', 'Customer')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_source_id UUID REFERENCES customer_sources(id) ON DELETE SET NULL,
    business_type_id UUID REFERENCES business_types(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
    `;

    // Create Products Table
    const productsQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description VARCHAR,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Customer Sources Table
    const customerSourcesQuery = `
      CREATE TABLE IF NOT EXISTS customer_sources (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create Business Types Table
    const businessTypesQuery = `
      CREATE TABLE IF NOT EXISTS business_types (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const customerProductsQuery = `
  CREATE TABLE IF NOT EXISTS customer_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
    const emailThreadsQuery = `
  CREATE TABLE IF NOT EXISTS emails_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    body TEXT,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50),
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

    // Create Email Replies Table
    const emailRepliesQuery = `
  CREATE TABLE IF NOT EXISTS email_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES emails_threads(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    replie_body TEXT,
    receive_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

    //crm settings table
    const crmSettingsQuery = `CREATE TABLE IF NOT EXISTS crm_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crm_name VARCHAR NOT NULL,
  crm_logo_url VARCHAR,
  primary_color VARCHAR(20),
  secondary_color VARCHAR(20),
  font_family VARCHAR,
  font_size VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

    const insertcrm = `INSERT INTO crm_settings (
  crm_name,
  crm_logo_url,
  primary_color,
  secondary_color,
  font_family,
  font_size
)
VALUES (
  'TopCity Light CRM',
  NULL,
  '#334155',
  '#ffffff',
  'Inter',
  '16px'
);
`;
    const update_timestamp = `CREATE TRIGGER set_timestamp_crm_settings
         BEFORE UPDATE ON crm_settings
         FOR EACH ROW
         EXECUTE PROCEDURE update_timestamp();`;

    // Execute all table creation queries sequentially
    //await pool.query(userQuery);
    // await pool.query(productsQuery);
    // await pool.query(customerSourcesQuery);
    // await pool.query(businessTypesQuery);
    //await pool.query(customerQuery);
    // await pool.query(customerProductsQuery);
    //await pool.query(emailThreadsQuery);
    //await pool.query(emailRepliesQuery);
    // await pool.query(crmSettingsQuery);
    // await pool.query(insertcrm);
    // await pool.query(update_timestamp);
    //     await pool.query(`ALTER TABLE customers
    // ADD COLUMN contact_person_phone VARCHAR(50);
    // `);

    //Attach Triggers for updated_at auto-update
    // await pool.query(`;
    //     CREATE TRIGGER set_timestamp_users
    //     BEFORE UPDATE ON users
    //     FOR EACH ROW
    //     EXECUTE PROCEDURE update_timestamp();

    //     CREATE TRIGGER set_timestamp_products
    //     BEFORE UPDATE ON products
    //     FOR EACH ROW
    //     EXECUTE PROCEDURE update_timestamp();

    //     CREATE TRIGGER set_timestamp_customer_sources
    //     BEFORE UPDATE ON customer_sources
    //     FOR EACH ROW
    //     EXECUTE PROCEDURE update_timestamp();

    //     CREATE TRIGGER set_timestamp_business_types
    //     BEFORE UPDATE ON business_types
    //     FOR EACH ROW
    //     EXECUTE PROCEDURE update_timestamp();

    //     CREATE TRIGGER set_timestamp_customer_products
    //     BEFORE UPDATE ON customer_products
    //     FOR EACH ROW
    //     EXECUTE PROCEDURE update_timestamp();

    //     CREATE TRIGGER set_timestamp_customers
    //     BEFORE UPDATE ON customers
    //     FOR EACH ROW
    //     EXECUTE PROCEDURE update_timestamp();

    //     CREATE TRIGGER set_timestamp_emails_threads
    // BEFORE UPDATE ON emails_threads
    // FOR EACH ROW
    // EXECUTE PROCEDURE update_timestamp();

    // CREATE TRIGGER set_timestamp_email_replies
    // BEFORE UPDATE ON email_replies
    // FOR EACH ROW
    // EXECUTE PROCEDURE update_timestamp();
    //   `);

    console.log("All tables and triggers created successfully.");
  } catch (error) {
    console.error(" Error creating tables:", error);
  }
};

export default createTables;
