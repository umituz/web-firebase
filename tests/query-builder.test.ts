import { describe, it, expect } from 'vitest'
import {
  QueryBuilder,
  createQueryBuilder,
  buildQueryConstraints,
  type QueryOptions,
} from '../src/domains/firestore/services/query-builder.service'

describe('QueryBuilder', () => {
  it('builds where constraints', () => {
    const constraints = new QueryBuilder()
      .where('status', '==', 'active')
      .where('count', '>', 10)
      .build()

    expect(constraints).toHaveLength(2)
  })

  it('supports shorthand condition helpers', () => {
    const constraints = new QueryBuilder()
      .equals('a', 1)
      .notEquals('b', 2)
      .greaterThan('c', 3)
      .lessThan('d', 4)
      .arrayContains('tags', 'x')
      .in('ids', ['1', '2'])
      .notIn('ids', ['3'])
      .arrayContainsAny('tags', ['x', 'y'])
      .build()

    expect(constraints).toHaveLength(8)
  })

  it('composes sorts, limit and cursor', () => {
    const constraints = new QueryBuilder()
      .ascending('name')
      .descending('createdAt')
      .limitTo(10)
      .startAfterCursor({ id: 'doc-1' })
      .build()

    expect(constraints).toHaveLength(4)
  })

  it('reset() clears accumulated state', () => {
    const builder = new QueryBuilder().where('a', '==', 1).limitTo(5)
    expect(builder.build()).toHaveLength(2)

    builder.reset()
    expect(builder.build()).toHaveLength(0)
  })

  it('clone() copies state independently', () => {
    const original = new QueryBuilder().where('a', '==', 1)
    const copy = original.clone()

    original.where('b', '==', 2)
    expect(original.build()).toHaveLength(2)
    expect(copy.build()).toHaveLength(1)
  })

  it('builds from options object', () => {
    const options: QueryOptions = {
      conditions: [{ field: 'status', operator: '==', value: 'active' }],
      sorts: [{ field: 'createdAt', direction: 'desc' }],
      limitCount: 20,
      cursor: { document: { id: 'x' }, type: 'startAfter' },
    }

    expect(buildQueryConstraints(options)).toHaveLength(4)
    expect(QueryBuilder.fromOptions(options).build()).toHaveLength(4)
  })

  it('createQueryBuilder() returns a fresh builder', () => {
    expect(createQueryBuilder()).toBeInstanceOf(QueryBuilder)
  })
})
