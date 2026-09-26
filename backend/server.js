const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "x-api-key",
        ],
        credentials: true,
    })
);

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const teamMemberRoutes = require("./routes/teamMemberRoutes");
const roleRoutes = require("./routes/roleRoutes");
const leadRoutes = require("./routes/leadRoutes");
const leadIntegrationRoutes = require("./routes/leadIntegrationRoutes");
const metaIntegrationRoutes = require("./routes/metaIntegrationRoutes");
const googleIntegrationRoutes = require("./routes/googleIntegrationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const contactRoutes = require("./routes/contactRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");
const aiKnowledgeRoutes = require("./routes/aiKnowledgeRoutes");
const aiConversationRoutes = require("./routes/aiConversationRoutes");
const aiWidgetRoutes = require("./routes/aiWidgetRoutes");

app.use(
    "/api/ai-widget",
    cors({
        origin: true,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use("/api/auth", authRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/services", serviceRoutes);

app.use("/api/team-members", teamMemberRoutes);

app.use("/api/roles", roleRoutes);

app.use("/api/leads", leadRoutes);

app.use("/api/integrations", leadIntegrationRoutes);

app.use("/api/integrations/meta", metaIntegrationRoutes);

app.use("/api/integrations/google", googleIntegrationRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/contacts", contactRoutes);

app.use("/api/invoices", invoiceRoutes);

app.use("/api/ai-assistant", aiAssistantRoutes);
app.use("/api/ai-knowledge", aiKnowledgeRoutes);
app.use("/api/ai-conversations", aiConversationRoutes);
app.use("/api/ai-widget", aiWidgetRoutes);

app.get("/api/location", (req, res) => {
    const forwarded = String(
        req.headers["x-forwarded-for"] || ""
    );

    const countryCode = String(
        req.headers["cf-ipcountry"] ||
            req.headers["x-country-code"] ||
            ""
    ).toUpperCase();

    const ip =
        forwarded.split(",")[0].trim() ||
        req.ip;

    res.json({
        success: true,
        countryCode,
        ip,
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Vitals Backend API is running",
    });
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SaleVitals Backend API is running",
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(
            "MongoDB connected successfully"
        );

        app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `Backend running on http://localhost:${PORT}`
                );

                console.log(
                    `Health check: http://localhost:${PORT}/api/health`
                );

                console.log(
                    `Services API: http://localhost:${PORT}/api/services`
                );

                console.log(
                    `Leads API: http://localhost:${PORT}/api/leads`
                );

                console.log(
                    `Roles API: http://localhost:${PORT}/api/roles`
                );

                console.log(
                    `Website Lead API: http://localhost:${PORT}/api/integrations/website/lead`
                );

                console.log(
                    `Invoices API: http://localhost:${PORT}/api/invoices`
                );
            }
        );
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );
    });