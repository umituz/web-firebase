/**
 * Query Builder Service
 * @description Fluent API for building complex Firestore queries
 * @domain Firestore
 * @layer Service
 */

import {
  where,
  orderBy,
  limit,
  startAfter,
  startAt,
  endAt,
  endBefore,
  query,
  type QueryConstraint,
  type Query,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore';

/**
 * Order direction
 */
export type OrderDirection = 'asc' | 'desc';

/**
 * Query operator
 */
export type QueryOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'array-contains-any'
  | 'in'
  | 'not-in';

/**
 * Query condition
 */
export interface QueryCondition {
  field: string;
  operator: QueryOperator;
  value: unknown;
}

/**
 * Query sort
 */
export interface QuerySort {
  field: string;
  direction: OrderDirection;
}

/**
 * Cursor for pagination
 */
export interface QueryCursor {
  document: DocumentData;
  type: 'startAfter' | 'startAt' | 'endAt' | 'endBefore';
}

/**
 * Query options
 */
export interface QueryOptions {
  conditions?: QueryCondition[];
  sorts?: QuerySort[];
  limitCount?: number;
  cursor?: QueryCursor;
}

/**
 * Query Builder Class
 */
export class QueryBuilder {
  private conditions: QueryCondition[] = [];
  private sorts: QuerySort[] = [];
  private limitCount?: number;
  private cursor?: QueryCursor;

  /**
   * Add where condition
   */
  where(field: string, operator: QueryOperator, value: unknown): this {
    this.conditions.push({ field, operator, value });
    return this;
  }

  /**
   * Add equals condition
   */
  equals(field: string, value: unknown): this {
    return this.where(field, '==', value);
  }

  /**
   * Add not equals condition
   */
  notEquals(field: string, value: unknown): this {
    return this.where(field, '!=', value);
  }

  /**
   * Add greater than condition
   */
  greaterThan(field: string, value: unknown): this {
    return this.where(field, '>', value);
  }

  /**
   * Add less than condition
   */
  lessThan(field: string, value: unknown): this {
    return this.where(field, '<', value);
  }

  /**
   * Add array contains condition
   */
  arrayContains(field: string, value: unknown): this {
    return this.where(field, 'array-contains', value);
  }

  /**
   * Add in condition
   */
  in(field: string, values: unknown[]): this {
    return this.where(field, 'in', values);
  }

  /**
   * Add not-in condition
   */
  notIn(field: string, values: unknown[]): this {
    return this.where(field, 'not-in', values);
  }

  /**
   * Add array contains any condition
   */
  arrayContainsAny(field: string, values: unknown[]): this {
    return this.where(field, 'array-contains-any', values);
  }

  /**
   * Add order by
   */
  orderBy(field: string, direction: OrderDirection = 'asc'): this {
    this.sorts.push({ field, direction });
    return this;
  }

  /**
   * Add ascending order
   */
  ascending(field: string): this {
    return this.orderBy(field, 'asc');
  }

  /**
   * Add descending order
   */
  descending(field: string): this {
    return this.orderBy(field, 'desc');
  }

  /**
   * Set limit
   */
  limitTo(count: number): this {
    this.limitCount = count;
    return this;
  }

  /**
   * Set cursor for pagination
   */
  startAfterCursor(document: DocumentData): this {
    this.cursor = { document, type: 'startAfter' };
    return this;
  }

  /**
   * Set start at cursor
   */
  startAtCursor(document: DocumentData): this {
    this.cursor = { document, type: 'startAt' };
    return this;
  }

  /**
   * Set end at cursor
   */
  endAtCursor(document: DocumentData): this {
    this.cursor = { document, type: 'endAt' };
    return this;
  }

  /**
   * Set end before cursor
   */
  endBeforeCursor(document: DocumentData): this {
    this.cursor = { document, type: 'endBefore' };
    return this;
  }

  /**
   * Build query constraints
   */
  build(): QueryConstraint[] {
    const constraints: QueryConstraint[] = [];

    // Add where conditions
    for (const condition of this.conditions) {
      constraints.push(where(condition.field, condition.operator, condition.value));
    }

    // Add order by
    for (const sort of this.sorts) {
      constraints.push(orderBy(sort.field, sort.direction));
    }

    // Add limit
    if (this.limitCount !== undefined) {
      constraints.push(limit(this.limitCount));
    }

    // Add cursor
    if (this.cursor) {
      switch (this.cursor.type) {
        case 'startAfter':
          constraints.push(startAfter(this.cursor.document));
          break;
        case 'startAt':
          constraints.push(startAt(this.cursor.document));
          break;
        case 'endAt':
          constraints.push(endAt(this.cursor.document));
          break;
        case 'endBefore':
          constraints.push(endBefore(this.cursor.document));
          break;
      }
    }

    return constraints;
  }

  /**
   * Build query from collection reference
   */
  buildQuery<T extends DocumentData>(
    collectionRef: CollectionReference<T>
  ): Query<T> {
    const constraints = this.build();
    return constraints.length > 0
      ? (query(collectionRef, ...constraints) as Query<T>)
      : (collectionRef as unknown as Query<T>);
  }

  /**
   * Reset builder
   */
  reset(): this {
    this.conditions = [];
    this.sorts = [];
    this.limitCount = undefined;
    this.cursor = undefined;
    return this;
  }

  /**
   * Clone builder
   */
  clone(): QueryBuilder {
    const builder = new QueryBuilder();
    builder.conditions = [...this.conditions];
    builder.sorts = [...this.sorts];
    builder.limitCount = this.limitCount;
    builder.cursor = this.cursor;
    return builder;
  }

  /**
   * Create from options
   */
  static fromOptions(options: QueryOptions): QueryBuilder {
    const builder = new QueryBuilder();

    if (options.conditions) {
      for (const condition of options.conditions) {
        builder.where(condition.field, condition.operator, condition.value);
      }
    }

    if (options.sorts) {
      for (const sort of options.sorts) {
        builder.orderBy(sort.field, sort.direction);
      }
    }

    if (options.limitCount) {
      builder.limitTo(options.limitCount);
    }

    if (options.cursor) {
      switch (options.cursor.type) {
        case 'startAfter':
          builder.startAfterCursor(options.cursor.document);
          break;
        case 'startAt':
          builder.startAtCursor(options.cursor.document);
          break;
        case 'endAt':
          builder.endAtCursor(options.cursor.document);
          break;
        case 'endBefore':
          builder.endBeforeCursor(options.cursor.document);
          break;
      }
    }

    return builder;
  }
}

/**
 * Create query builder
 */
export function createQueryBuilder(): QueryBuilder {
  return new QueryBuilder();
}

/**
 * Build query constraints from options
 */
export function buildQueryConstraints(options: QueryOptions): QueryConstraint[] {
  return QueryBuilder.fromOptions(options).build();
}
