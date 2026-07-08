"use server";

import { getOrderHistoryForForecast } from "@/db/queries/AdminForecast";
import { fetchDemandForecast } from "@/lib/flaskClient";

export async function generateDemandForecast(canteenId: string) {
    const orders = await getOrderHistoryForForecast(canteenId);
    if (orders.length === 0) return { forecasts: [] };
    return fetchDemandForecast(orders, 7);
}