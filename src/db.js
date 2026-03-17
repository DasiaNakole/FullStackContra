const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "dashboard.sqlite");

const seedUsers = [
  {
    email: "demo@dashboard.com",
    password: "demo123",
    full_name: "Demo User",
  },
];

const seedLeads = [
  ["Acme Roofing", "New", "High", "Austin, TX", "2026-03-17", "Email follow-up needed"],
  ["Lakefront Plumbing", "Contacted", "Medium", "Chicago, IL", "2026-03-16", "Requested pricing sheet"],
  ["Northstar HVAC", "Qualified", "High", "Denver, CO", "2026-03-15", "Booked intro call"],
  ["BrightPath Solar", "Follow Up", "Medium", "Phoenix, AZ", "2026-03-14", "Waiting on response"],
  ["Metro Legal Group", "New", "Low", "Dallas, TX", "2026-03-17", "Needs case-study send"],
  ["Pioneer Dental", "Follow Up", "Medium", "Nashville, TN", "2026-03-13", "Warm inbound lead"],
  ["Summit Logistics", "Qualified", "High", "Atlanta, GA", "2026-03-12", "Ops team requested demo"],
  ["BluePeak Fitness", "New", "Low", "Miami, FL", "2026-03-17", "Needs outbound sequence"],
];

function openDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return new Database(dbPath);
}

function initializeDatabase() {
  const db = openDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      city TEXT NOT NULL,
      created_at TEXT NOT NULL,
      notes TEXT NOT NULL
    );
  `);

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(
      "INSERT INTO users (email, password, full_name) VALUES (@email, @password, @full_name)"
    );
    for (const user of seedUsers) {
      insertUser.run(user);
    }
  }

  const leadCount = db.prepare("SELECT COUNT(*) AS count FROM leads").get().count;
  if (leadCount === 0) {
    const insertLead = db.prepare(`
      INSERT INTO leads (company_name, status, priority, city, created_at, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const lead of seedLeads) {
      insertLead.run(...lead);
    }
  }

  db.close();
}

function authenticateUser(email, password) {
  const db = openDb();
  const user = db
    .prepare("SELECT id, email, full_name FROM users WHERE email = ? AND password = ?")
    .get(email, password);
  db.close();
  return user || null;
}

function getLeads() {
  const db = openDb();
  const leads = db
    .prepare(
      "SELECT id, company_name, status, priority, city, created_at, notes FROM leads ORDER BY date(created_at) DESC, id DESC"
    )
    .all();
  db.close();
  return leads;
}

function getDashboardMetrics() {
  const leads = getLeads();
  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const followUps = leads.filter((lead) => lead.status === "Follow Up").length;
  const qualified = leads.filter((lead) => lead.status === "Qualified").length;
  return {
    totalLeads,
    newLeads,
    followUps,
    qualified,
  };
}

function getLeadTrend() {
  const db = openDb();
  const rows = db
    .prepare(`
      SELECT created_at AS day, COUNT(*) AS count
      FROM leads
      GROUP BY created_at
      ORDER BY date(created_at) ASC
    `)
    .all();
  db.close();
  return rows;
}

module.exports = {
  initializeDatabase,
  getDashboardMetrics,
  getLeadTrend,
  getLeads,
  authenticateUser,
};
