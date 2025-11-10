import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import errorHandler from "./utils/errorHandler.js";
import { fetchIncomingEmails } from "./utils/imapFetcher.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
//console.log(await fetchIncomingEmails());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
//fetchIncomingEmails();

//routes import
import userRouter from "./routes/user.routes.js";
import productRouter from "./routes/product.routes.js";
import customerSourceRouter from "./routes/customer_source.routes.js";
import businessTypesRouter from "./routes/business_types.routes.js";
import userManagement from "./routes/user_management.routes.js";
import crmSettingsRouter from "./routes/crm_settings.routes.js";
import customersRouter from "./routes/customers.routes.js";
import customerProductsRouter from "./routes/customer_products.routes.js";
import mailRouter from "./routes/mail.routes.js";
import mailSettingsRouter from "./routes/mail_settings.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/customer-sources", customerSourceRouter);
app.use("/api/v1/business-types", businessTypesRouter);
app.use("/api/v1/user-management", userManagement);
app.use("/api/v1/crm-settings", crmSettingsRouter);
app.use("/api/v1/customers", customersRouter);
app.use("/api/v1/customer-products", customerProductsRouter);
app.use("/api/v1/mail", mailRouter);
app.use("/api/v1/mail-settings", mailSettingsRouter);

app.use(errorHandler);
export { app };
