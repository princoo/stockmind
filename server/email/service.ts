import nodemailer from "nodemailer";
import { findProductSupplierEmailContext } from "@/server/email/email-repository";
import { EmailServiceError } from "@/server/email/errors";
import {
  buildRestockEmailBody,
  buildRestockEmailSubject,
} from "@/server/email/templates";

type TriggerReason = "MANUAL" | "LOW_STOCK" | "OUT_OF_STOCK";

let transporterRef: nodemailer.Transporter | null = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !portRaw || !user || !pass || !from) {
    throw new EmailServiceError(
      "SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.",
      500,
    );
  }

  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new EmailServiceError("SMTP_PORT must be a valid number.", 500);
  }

  return { host, port, user, pass, from };
}

function getTransporter() {
  if (transporterRef) return transporterRef;
  const config = getSmtpConfig();

  transporterRef = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  return transporterRef;
}

function getDefaultRequestedQuantity(currentStock: number, lowStockThreshold: number) {
  return Math.max(1, lowStockThreshold * 2 - currentStock);
}

function getDefaultMessage(input: {
  productName: string;
  sku: string;
  currentStock: number;
  requestedQuantity: number;
  trigger: TriggerReason;
}) {
  const lead = input.trigger === "OUT_OF_STOCK" ? "out of stock" : "running low on stock";
  return [
    `We are currently ${lead} for ${input.productName} (${input.sku}).`,
    `Current stock is ${input.currentStock}.`,
    `Please send ${input.requestedQuantity} units as soon as possible.`,
  ].join(" ");
}

export async function sendSupplierRestockRequest(input: {
  productId: string;
  requestedQuantity?: number;
  message?: string;
  trigger: TriggerReason;
  requestedByName?: string;
}) {
  const product = await findProductSupplierEmailContext(input.productId);
  if (!product) {
    throw new EmailServiceError("Product not found.", 404);
  }
  if (!product.supplier?.email) {
    throw new EmailServiceError("Supplier email is not available for this product.");
  }

  const requestedQuantity =
    input.requestedQuantity && input.requestedQuantity > 0
      ? Math.floor(input.requestedQuantity)
      : getDefaultRequestedQuantity(product.quantity, product.lowStockThreshold);

  const message =
    input.message?.trim() ||
    getDefaultMessage({
      productName: product.name,
      sku: product.sku,
      currentStock: product.quantity,
      requestedQuantity,
      trigger: input.trigger,
    });

  const subject = buildRestockEmailSubject({
    productName: product.name,
    sku: product.sku,
    currentStock: product.quantity,
  });
  const body = buildRestockEmailBody({
    supplierName: product.supplier.name,
    productName: product.name,
    sku: product.sku,
    currentStock: product.quantity,
    requestedQuantity,
    message,
    requestedByName: input.requestedByName,
  });

  const transporter = getTransporter();
  const smtp = getSmtpConfig();
  await transporter.sendMail({
    from: smtp.from,
    to: product.supplier.email,
    subject,
    text: body.text,
    html: body.html,
  });

  return {
    productId: product.id,
    productName: product.name,
    supplierName: product.supplier.name,
    supplierEmail: product.supplier.email,
    requestedQuantity,
  };
}

export async function sendSupplierRestockRequestBestEffort(input: {
  productId: string;
  requestedQuantity?: number;
  message?: string;
  trigger: TriggerReason;
  requestedByName?: string;
}) {
  try {
    await sendSupplierRestockRequest(input);
  } catch (error) {
    console.error("Failed to send supplier restock email.", error);
  }
}
