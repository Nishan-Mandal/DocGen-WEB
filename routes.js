
const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

export const ROUTES = {
    home: "/",
    docs: isLocal ? "/docs.html" : "/docs",
    pricing: isLocal ? "/pricing.html" : "/pricing",
    contact: isLocal
        ? "/components/pages/contact.html"
        : "/contact",
    terms: isLocal
        ? "/components/pages/terms_conditions.html"
        : "/terms",
    privacy: isLocal
        ? "/components/pages/privacy_policy.html"
        : "/privacy",
    refund: isLocal
        ? "/components/pages/refund_policy.html"
        : "/refund",

    // Application pages
    dashboard: isLocal ? "/dashboard.html" : "/dashboard",
    signup: isLocal ? "/components/signup.html" : "/signup",
    login: isLocal ? "/components/login.html" : "/login"
};