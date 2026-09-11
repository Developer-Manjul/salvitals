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

const authRoutes = require(
    "./routes/authRoutes"
);

const paymentRoutes = require(
    "./routes/paymentRoutes"
);

const serviceRoutes = require(
    "./routes/serviceRoutes"
);

console.log(
    "AUTH ROUTES LOADED"
);

console.log(
    "PAYMENT ROUTES LOADED"
);

console.log(
    "SERVICE ROUTES LOADED"
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/payment",
    paymentRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/services",
    serviceRoutes
);

app.get(
    "/api/location",
    (req, res) => {
        const forwarded =
            String(
                req.headers[
                    "x-forwarded-for"
                ] || ""
            );

        const countryCode =
            String(
                req.headers[
                    "cf-ipcountry"
                ] ||
                req.headers[
                    "x-country-code"
                ] ||
                ""
            ).toUpperCase();

        const ip =
            forwarded
                .split(",")[0]
                .trim() ||
            req.ip;

        res.json({
            success: true,
            countryCode,
            ip,
        });
    }
);

app.get(
    "/api/health",
    (req, res) => {
        res.status(200).json({
            success: true,
            message:
                "Vitals Backend API is running",
        });
    }
);

app.get(
    "/",
    (req, res) => {
        res.json({
            success: true,
            message:
                "SaleVitals Backend API is running",
        });
    }
);

app.use(
    (req, res) => {
        res.status(404).json({
            success: false,
            message:
                "API route not found",
        });
    }
);

const PORT =
    process.env.PORT || 5000;

mongoose
    .connect(
        process.env.MONGODB_URI
    )
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