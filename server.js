const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");

const {
  initializeDatabase,
  getDashboardMetrics,
  getLeadTrend,
  getLeads,
  authenticateUser,
} = require("./src/db");

const app = express();
const PORT = process.env.PORT || 3000;
const DEMO_AUTH_COOKIE = "dashboard_auth";

initializeDatabase();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use("/static", express.static(path.join(__dirname, "public")));

function isAuthenticated(req) {
  return req.cookies[DEMO_AUTH_COOKIE] === "true";
}

function requireAuth(req, res, next) {
  if (!isAuthenticated(req)) {
    return res.redirect("/login");
  }
  return next();
}

app.get("/", (req, res) => {
  if (isAuthenticated(req)) {
    return res.redirect("/dashboard");
  }
  return res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (isAuthenticated(req)) {
    return res.redirect("/dashboard");
  }
  return res.render("login", { error: "" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = authenticateUser(email, password);

  if (!user) {
    return res.status(401).render("login", {
      error: "Invalid credentials. Use demo@dashboard.com / demo123",
    });
  }

  res.cookie(DEMO_AUTH_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
  });
  return res.redirect("/dashboard");
});

app.post("/logout", (req, res) => {
  res.clearCookie(DEMO_AUTH_COOKIE);
  return res.redirect("/login");
});

app.get("/dashboard", requireAuth, (req, res) => {
  const metrics = getDashboardMetrics();
  const leads = getLeads();
  return res.render("dashboard", {
    metrics,
    leads,
  });
});

app.get("/api/metrics", requireAuth, (req, res) => {
  res.json(getDashboardMetrics());
});

app.get("/api/leads", requireAuth, (req, res) => {
  res.json({ leads: getLeads() });
});

app.get("/api/analytics/trend", requireAuth, (req, res) => {
  res.json({ points: getLeadTrend() });
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
