/**
 * @fileoverview Web API service functions for purchase record management
 * @description This file contains API functions for purchase record queries,
 * order history management, and related type definitions for the web interface.
 *
 * @author BuildingAI Teams
 */

import type { BaseEntity, BaseQueryParams, PaginationResult } from "../models/globals";

// ==================== Type Definitions ====================

/**
 * Purchase record interface
 * @description Interface for purchase record response data
 */
export type PurchaseRecord = PaginationResult<PurchaseRecordItem>;

/**
 * Purchase record item interface
 * @description Interface for individual purchase record item
 */
export interface PurchaseRecordItem extends BaseEntity {
    /** Gift power amount */
    givePower?: number;
    /** Actual payment amount */
    orderAmount?: string;
    /** Order number */
    orderNo?: string;
    /** Payment method */
    payType?: number;
    /** Payment method description */
    payTypeDesc?: string;
    /** Recharge power amount */
    power?: number;
    /** Refund status: 0-no, 1-yes */
    refundStatus?: number;
    /** Total amount */
    totalAmount?: string;
    /** Actual received amount */
    totalPower?: number;
}

/**
 * Purchase record query parameters interface
 * @description Parameters for querying purchase record list
 */
export type PurchaseRecordQueryParams = BaseQueryParams;

// ==================== Purchase Record Related APIs ====================

/**
 * Get purchase record list
 * @description Get paginated list of purchase records
 * @param params Query parameters
 * @returns Promise with purchase record data
 */
export function apiPurchaseRecord(params: PurchaseRecordQueryParams): Promise<PurchaseRecord> {
    return useWebGet("/recharge/lists", params);
}
