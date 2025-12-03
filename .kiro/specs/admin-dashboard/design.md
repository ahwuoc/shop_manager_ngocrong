# Design Document: Admin Dashboard

## Overview

The Admin Dashboard is a Next.js-based administrative interface that provides centralized management for game administrative functions. The dashboard will feature a clean, card-based navigation system with three primary management sections: Gift Codes, Shop Items, and Top-up Milestones. The design leverages Next.js 16's App Router, React Server Components, and Prisma ORM for efficient data management.

## Architecture

### Technology Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: MySQL via Prisma ORM
- **UI Components**: Custom React components with Tailwind
- **Icons**: Lucide React (to be added)

### Application Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin layout with navigation
│   ├── page.tsx                # Dashboard home with menu cards
│   ├── gift-codes/
│   │   ├── page.tsx            # Gift code list view
│   │   ├── new/
│   │   │   └── page.tsx        # Create gift code form
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx    # Edit gift code form
│   ├── shop/
│   │   ├── page.tsx            # Shop items list view
│   │   ├── new/
│   │   │   └── page.tsx        # Create shop item form
│   │   └── [id]/
│   │       └── edit/
│   │           └── page.tsx    # Edit shop item form
│   └── milestones/
│       ├── page.tsx            # Milestones list view
│       ├── new/
│       │   └── page.tsx        # Create milestone form
│       └── [id]/
│           └── edit/
│               └── page.tsx    # Edit milestone form
├── api/
│   └── admin/
│       ├── gift-codes/
│       │   └── route.ts        # Gift code API endpoints
│       ├── shop/
│       │   └── route.ts        # Shop API endpoints
│       └── milestones/
│           └── route.ts        # Milestone API endpoints
└── components/
    └── admin/
        ├── DashboardCard.tsx   # Reusable menu card component
        ├── GiftCodeForm.tsx    # Gift code form component
        ├── ShopItemForm.tsx    # Shop item form component
        ├── MilestoneForm.tsx   # Milestone form component
        └── LoadingSpinner.tsx  # Loading indicator component
```

## Components and Interfaces

### 1. Dashboard Home Page (`app/admin/page.tsx`)

The main dashboard displays three navigation cards in a responsive grid layout.

**Component Structure**:
```typescript
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  iconColor: string;
}
```

**Features**:
- Responsive grid (1 column mobile, 2 columns tablet, 3 columns desktop)
- Hover effects with scale and shadow transitions
- Icon with colored background
- Clear typography hierarchy

### 2. Gift Code Management

**Data Model** (existing `gift_codes` table):
```typescript
interface GiftCode {
  id: bigint;
  type: number;          // 0: single-use, 1: multi-use
  code: string;
  gold: number;
  gem: number;
  ruby: number;
  items: string | null;  // JSON array of item IDs
  status: number;        // 0: inactive, 1: active
  active: number;        // usage count
  expires_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}
```

**List View Features**:
- Table with columns: Code, Type, Rewards, Status, Expiry, Actions
- Filter by status (active/inactive/expired)
- Search by code
- Pagination (20 items per page)
- Quick actions: Edit, Delete, Toggle Status

**Form Features**:
- Code generation button (random alphanumeric)
- Type selection (single-use/multi-use)
- Reward inputs (gold, gem, ruby)
- Item selector (multi-select from item_template)
- Expiry date picker
- Status toggle
- Validation: unique code, positive rewards, future expiry date

### 3. Shop Management

**Data Model** (existing `item_shop` table):
```typescript
interface ShopItem {
  id: number;
  tab_id: number;
  temp_id: number;
  gold: number;
  gem: number;
  is_new: boolean;
  is_sell: boolean;
  item_exchange: number;
  quantity_exchange: number;
  create_time: Date;
}
```

**List View Features**:
- Table with columns: Item Name, Tab, Price (Gold/Gem), New Badge, Status, Actions
- Filter by tab_id
- Filter by is_sell status
- Search by item name (join with item_template)
- Pagination (20 items per page)

**Form Features**:
- Item template selector (dropdown from item_template)
- Tab selector (dropdown from tab_shop)
- Price inputs (gold and gem)
- Exchange item selector (optional)
- Exchange quantity input
- "New" badge toggle
- "Available for sale" toggle
- Validation: positive prices, valid item references

### 4. Top-up Milestone Management

**Data Model** (existing `moc_nap` table):
```typescript
interface Milestone {
  id: number;
  required: number;      // Amount required to unlock
  descriptor: string | null;
  rewards: string | null; // JSON array of rewards
  created_at: Date | null;
}
```

**List View Features**:
- Table with columns: Threshold, Description, Rewards, Actions
- Sorted by required amount (ascending)
- Visual progress indicator
- Quick actions: Edit, Delete

**Form Features**:
- Threshold input (VND amount)
- Description textarea
- Rewards builder:
  - Add multiple reward types (gold, gem, items)
  - Item selector for item rewards
  - Quantity inputs
- Validation: unique threshold, positive amount, at least one reward

## Data Models

### Prisma Client Usage

All database operations will use the existing Prisma client configured at `app/generated/prisma`.

**Import Pattern**:
```typescript
import { PrismaClient } from '@/app/generated/prisma';
const prisma = new PrismaClient();
```

### API Response Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 2.2, 3.2, and 4.2 all test list view rendering and can be generalized into a single property about data display
- Properties 2.3, 3.3, and 4.3 all test form validation and persistence, which share common validation patterns
- Properties 2.4, 3.4, and 4.4 all test update operations and can be consolidated

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Menu item rendering completeness
*For any* menu item configuration, when rendered, the component should contain both an icon element and a text label element
**Validates: Requirements 1.2**

### Property 2: Responsive layout adaptation
*For any* viewport width, the dashboard layout should adjust the number of grid columns appropriately (1 column for mobile <640px, 2 columns for tablet 640-1024px, 3 columns for desktop >1024px)
**Validates: Requirements 1.3**

### Property 3: Hover state feedback
*For any* interactive menu item, when a hover event is triggered, the element should apply visual feedback styles (scale, shadow, or color change)
**Validates: Requirements 1.4**

### Property 4: List view data completeness
*For any* entity (gift code, shop item, or milestone) in a list view, all required properties should be rendered in the table row
**Validates: Requirements 2.2, 3.2, 4.2**

### Property 5: Form validation and persistence
*For any* valid entity data submitted through a create form, the data should be validated according to business rules and persisted to the database with all fields intact
**Validates: Requirements 2.3, 3.3, 4.3**

### Property 6: Update operation consistency
*For any* existing entity, when updated through the edit form, the changes should be persisted to the database and the updated values should match the submitted values
**Validates: Requirements 2.4, 3.4, 4.4**

### Property 7: Theme support
*For any* theme preference (light or dark), the dashboard should apply the corresponding theme classes to all components
**Validates: Requirements 5.2**

### Property 8: Progressive rendering
*For any* dashboard page load, the navigation menu should be rendered before data fetching operations complete
**Validates: Requirements 6.2**

### Property 9: Loading indicator display
*For any* navigation or data operation exceeding 500ms, a loading indicator should be displayed to the user
**Validates: Requirements 6.3**

### Property 10: Unique threshold validation
*For any* milestone threshold value, when creating or updating a milestone, the system should reject duplicate threshold values
**Validates: Requirements 4.3**

## Error Handling

### Client-Side Validation

**Form Validation Rules**:

1. **Gift Code Form**:
   - Code: Required, 6-20 characters, alphanumeric only, must be unique
   - Type: Required, must be 0 or 1
   - Rewards: At least one reward (gold, gem, ruby, or items) must be > 0
   - Expiry Date: Optional, but if provided must be in the future
   - Items: Valid JSON array of item IDs that exist in item_template

2. **Shop Item Form**:
   - Item Template: Required, must exist in item_template table
   - Tab: Required, must exist in tab_shop table
   - Gold/Gem: At least one must be > 0
   - Exchange Item: If provided, must exist in item_template
   - Exchange Quantity: Required if exchange item is set, must be > 0

3. **Milestone Form**:
   - Threshold: Required, must be positive integer, must be unique
   - Description: Optional, max 255 characters
   - Rewards: Required, must have at least one reward with quantity > 0

### Server-Side Error Handling

**API Error Responses**:

```typescript
enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
}

interface ErrorResponse {
  success: false;
  error: ErrorCode;
  message: string;
  details?: Record<string, string[]>; // Field-level errors
}
```

**Error Handling Strategy**:

1. **Database Errors**: Catch Prisma errors and return appropriate HTTP status codes
   - Unique constraint violations → 409 Conflict
   - Foreign key violations → 400 Bad Request
   - Connection errors → 503 Service Unavailable

2. **Validation Errors**: Return 400 Bad Request with field-level error details

3. **Not Found Errors**: Return 404 Not Found for missing resources

4. **Unexpected Errors**: Log error details, return 500 Internal Server Error with generic message

### User Feedback

**Toast Notifications**:
- Success: Green toast with checkmark icon
- Error: Red toast with error icon
- Warning: Yellow toast with warning icon
- Info: Blue toast with info icon

**Inline Validation**:
- Real-time validation on blur
- Error messages below form fields
- Red border on invalid fields
- Green border on valid fields

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Unit Test Coverage**:

1. **Component Tests**:
   - DashboardCard: Renders with correct props, handles click events
   - Form Components: Validation logic, submission handling, error display
   - LoadingSpinner: Renders correctly, shows/hides based on prop

2. **API Route Tests**:
   - Gift Code API: CRUD operations, validation, error handling
   - Shop API: CRUD operations, validation, error handling
   - Milestone API: CRUD operations, unique threshold validation

3. **Utility Function Tests**:
   - Form validation functions
   - Data transformation functions
   - Date formatting functions

### Property-Based Testing

**Framework**: fast-check (already available in node_modules)

**Configuration**: Each property-based test should run a minimum of 100 iterations.

**Property Test Coverage**:

Each property-based test MUST be tagged with a comment explicitly referencing the correctness property in this design document using this exact format: `**Feature: admin-dashboard, Property {number}: {property_text}**`

1. **Property 1 Test**: Generate random menu item configurations and verify icon and label presence
2. **Property 2 Test**: Generate random viewport widths and verify grid column count
3. **Property 3 Test**: Generate random menu items and verify hover state changes
4. **Property 4 Test**: Generate random entity data and verify all fields render in list view
5. **Property 5 Test**: Generate random valid entity data and verify persistence
6. **Property 6 Test**: Generate random entity updates and verify consistency
7. **Property 7 Test**: Generate random theme preferences and verify class application
8. **Property 8 Test**: Verify menu renders before data operations complete
9. **Property 9 Test**: Generate random operation delays and verify loading indicator display
10. **Property 10 Test**: Generate random threshold values and verify duplicate rejection

### Integration Testing

**Test Scenarios**:

1. **End-to-End Gift Code Management**:
   - Navigate to gift codes page
   - Create new gift code
   - Verify it appears in list
   - Edit the gift code
   - Verify changes persist
   - Delete the gift code
   - Verify it's removed from list

2. **End-to-End Shop Management**:
   - Navigate to shop page
   - Create new shop item
   - Toggle availability
   - Verify status changes
   - Update pricing
   - Verify changes persist

3. **End-to-End Milestone Management**:
   - Navigate to milestones page
   - Create multiple milestones
   - Verify sorting by threshold
   - Update rewards
   - Verify changes persist
   - Attempt to create duplicate threshold
   - Verify rejection

### Test Data Generators

**Property-Based Test Generators**:

```typescript
// Gift Code Generator
const giftCodeArbitrary = fc.record({
  code: fc.stringMatching(/^[A-Z0-9]{6,20}$/),
  type: fc.integer({ min: 0, max: 1 }),
  gold: fc.integer({ min: 0, max: 1000000 }),
  gem: fc.integer({ min: 0, max: 10000 }),
  ruby: fc.integer({ min: 0, max: 1000 }),
  status: fc.integer({ min: 0, max: 1 }),
});

// Shop Item Generator
const shopItemArbitrary = fc.record({
  tab_id: fc.integer({ min: 1, max: 10 }),
  temp_id: fc.integer({ min: 1, max: 1000 }),
  gold: fc.integer({ min: 0, max: 1000000 }),
  gem: fc.integer({ min: 0, max: 10000 }),
  is_new: fc.boolean(),
  is_sell: fc.boolean(),
});

// Milestone Generator
const milestoneArbitrary = fc.record({
  required: fc.integer({ min: 1000, max: 10000000 }),
  descriptor: fc.string({ minLength: 10, maxLength: 100 }),
  rewards: fc.jsonValue(),
});
```

## Performance Considerations

### Optimization Strategies

1. **Server Components**: Use React Server Components for data fetching to reduce client-side JavaScript

2. **Pagination**: Implement cursor-based pagination for large datasets

3. **Caching**: Use Next.js built-in caching for static data (item templates, tabs)

4. **Lazy Loading**: Lazy load form components and modals

5. **Database Indexing**: Ensure indexes exist on frequently queried columns:
   - `gift_codes.code` (already unique)
   - `gift_codes.status`
   - `item_shop.tab_id` (already indexed)
   - `moc_nap.required` (already indexed)

### Loading States

1. **Skeleton Screens**: Show skeleton loaders for list views during data fetching

2. **Optimistic Updates**: Update UI immediately on user actions, rollback on error

3. **Debounced Search**: Debounce search inputs (300ms) to reduce API calls

## Security Considerations

### Authentication & Authorization

**Note**: This design assumes authentication will be implemented separately. The admin routes should be protected by middleware that verifies:
- User is authenticated
- User has admin role (`is_admin = true` in account table)

### Input Sanitization

1. **SQL Injection Prevention**: Prisma provides parameterized queries by default

2. **XSS Prevention**: React escapes content by default, but be cautious with `dangerouslySetInnerHTML`

3. **CSRF Protection**: Next.js API routes should implement CSRF tokens for state-changing operations

### Data Validation

1. **Server-Side Validation**: Always validate on server, never trust client input

2. **Type Safety**: Use TypeScript and Zod for runtime validation

3. **Rate Limiting**: Implement rate limiting on API routes to prevent abuse

## Deployment Considerations

### Environment Variables

Required environment variables:
```
DATABASE_URL=mysql://user:password@host:port/database
NODE_ENV=production
```

### Database Migrations

No schema changes required - using existing tables:
- `gift_codes`
- `item_shop`
- `item_shop_option`
- `moc_nap`
- `item_template`
- `tab_shop`

### Build Process

1. Run type checking: `tsc --noEmit`
2. Run linting: `npm run lint`
3. Run tests: `npm test`
4. Build application: `npm run build`

## Future Enhancements

1. **Bulk Operations**: Import/export gift codes via CSV
2. **Analytics Dashboard**: Usage statistics for gift codes and shop items
3. **Audit Log**: Track all admin actions with timestamps
4. **Advanced Filtering**: Multi-column filtering and sorting
5. **Real-time Updates**: WebSocket integration for live data updates
6. **Role-Based Permissions**: Granular permissions for different admin levels
