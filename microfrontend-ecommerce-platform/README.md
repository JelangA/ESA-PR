# Microfrontend E-commerce Platform

A production-ready microfrontend e-commerce application built with Webpack Module Federation, React, Vue 3, TypeScript, and an RxJS Global Store for cross-microfrontend state management.

## Overview

This project demonstrates a modern microfrontend architecture where multiple independent frontend applications work together to create a unified e-commerce experience:

- **Container (React)** - Host application providing routing, layout, and composition
- **Products (Vue 3)** - Product catalog and details
- **Cart (React)** - Shopping cart and checkout flow
- **Auth (React)** - Authentication and user profile
- **Shared** - Types, utilities, and the centralized RxJS Global Store

State is centralized in the Shared package and persisted to localStorage. All microfrontends subscribe to the same reactive store and update in real-time.

## Architecture

```mermaid
graph TD
    A[Container React] --> B[Products Vue]
    A --> C[Cart React]
    A --> D[Auth React]
    A --> E[Shared RxJS Store]
    B --> E
    C --> E
    D --> E
    E --> F[localStorage]
```

### Runtime Integration (Module Federation)

```mermaid
flowchart LR
    Host[Container App] -- consumes --> RemoteProducts[products/remoteEntry.js]
    Host -- consumes --> RemoteCart[cart/remoteEntry.js]
    Host -- consumes --> RemoteAuth[auth/remoteEntry.js]
    Host -- shares --> SharedDeps[React, Vue, Shared Library]
```

## How the Complete System Works

### Complete Application Flow

```mermaid
graph TD
    subgraph "User Journey"
        A[User opens app] --> B[Container loads]
        B --> C[Header with navigation]
        C --> D[User clicks Products]
        D --> E[Products microfrontend loads]
        E --> F[User sees product list]
        F --> G[User clicks Add to Cart]
        G --> H[RxJS store updates]
        H --> I[All UIs update instantly]
        I --> J[User sees quantity controls]
        J --> K[User goes to Cart page]
        K --> L[Cart shows added items]
        L --> M[User can checkout]
    end

    subgraph "Behind the Scenes"
        N[Module Federation] --> O[Runtime composition]
        P[RxJS Global Store] --> Q[Reactive updates]
        R[localStorage] --> S[Data persistence]
        T[Webpack] --> U[Code sharing]
    end

    H --> P
    P --> R
    O --> B
    Q --> I
```

### Detailed Data Flow

```mermaid
sequenceDiagram
    participant Browser as Browser
    participant Container as Container (React)
    participant Products as Products (Vue)
    participant RxJS as RxJS Global Store
    participant Cart as Cart (React)
    participant Auth as Auth (React)
    participant Storage as localStorage

    Note over Browser,Storage: Application Startup
    Browser->>Container: Load http://localhost:3000
    Container->>RxJS: Initialize global store
    RxJS->>Storage: Load saved state (cart, user)
    Storage-->>RxJS: Return saved data
    RxJS-->>Container: Emit initial state
    Container->>Container: Render header with cart count

    Note over Browser,Storage: User Navigation
    Browser->>Container: User clicks Products link
    Container->>Products: Load products microfrontend
    Products->>Products: Fetch product list from API
    Products->>RxJS: Subscribe to cart state
    RxJS-->>Products: Emit current cart state
    Products->>Browser: Render products with smart buttons

    Note over Browser,Storage: Add to Cart Flow
    Browser->>Products: User clicks "Add to Cart"
    Products->>RxJS: globalStore.addToCart(product, quantity)
    RxJS->>RxJS: Update cart state (reducer)
    RxJS->>Storage: Persist updated state
    RxJS-->>Container: Emit new cart count
    RxJS-->>Products: Emit cart update
    RxJS-->>Cart: Emit cart update (if loaded)
    
    Container->>Browser: Update header cart count
    Products->>Browser: Change button to quantity controls
    
    Note over Browser,Storage: Cart Page Visit
    Browser->>Container: User clicks Cart link
    Container->>Cart: Load cart microfrontend
    Cart->>RxJS: Subscribe to cart state
    RxJS-->>Cart: Emit current cart items
    Cart->>Cart: Fetch missing product details
    Cart->>Browser: Render cart with items and totals

    Note over Browser,Storage: Authentication Flow
    Browser->>Container: User clicks Login
    Container->>Auth: Load auth microfrontend
    Auth->>Auth: Show login form
    Browser->>Auth: User submits credentials
    Auth->>Auth: Validate with API
    Auth->>RxJS: globalStore.setUser(user)
    RxJS->>Storage: Persist user data
    RxJS-->>Container: Emit user state
    Container->>Browser: Show user info in header
    Auth->>Browser: Show user profile
```

### State Management Flow

```mermaid
graph LR
    subgraph "Any Microfrontend"
        A[User Action] --> B[Component Handler]
        B --> C[RxJS Store Method]
    end

    subgraph "RxJS Global Store"
        C --> D[Dispatch Action]
        D --> E[Reducer Updates State]
        E --> F[BehaviorSubject Emits]
    end

    subgraph "All Subscribed Components"
        F --> G[Container Header]
        F --> H[Products Buttons]
        F --> I[Cart Items]
        F --> J[Auth Profile]
    end

    subgraph "Persistence"
        E --> K[Auto-save to localStorage]
        K --> L[Available on page refresh]
    end

    G --> M[UI Re-renders]
    H --> M
    I --> M
    J --> M
```

### Module Federation Runtime

```mermaid
graph TD
    subgraph "Build Time"
        A[Container webpack.config.js] --> B[Define remotes]
        C[Products webpack.config.js] --> D[Expose ./App]
        E[Cart webpack.config.js] --> F[Expose ./App]
        G[Auth webpack.config.js] --> H[Expose ./App]
    end

    subgraph "Runtime (Browser)"
        I[Container loads] --> J[Fetch remoteEntry.js files]
        J --> K[products/remoteEntry.js]
        J --> L[cart/remoteEntry.js]
        J --> M[auth/remoteEntry.js]
        
        K --> N[Products Vue App]
        L --> O[Cart React App]
        M --> P[Auth React App]
        
        Q[React Router] --> N
        Q --> O
        Q --> P
    end

    subgraph "Shared Dependencies"
        R[React 18] --> I
        R --> O
        R --> P
        S[Shared Library] --> I
        S --> N
        S --> O
        S --> P
    end
```

## Detailed System Explanation

### How Everything Works Together

The microfrontend e-commerce platform operates through a carefully orchestrated system of independent applications that communicate via a centralized RxJS Global Store. Here's how each component contributes to the overall functionality:

#### 1. Application Startup Process

When a user visits the application:

1. **Container Loads First** - The host React application initializes
2. **RxJS Store Initialization** - Global store loads saved state from localStorage
3. **Module Federation Setup** - Container prepares to load remote microfrontends
4. **Header Renders** - Shows navigation and current cart count/user status
5. **Route Matching** - React Router determines which microfrontend to load

#### 2. Microfrontend Loading Process

```mermaid
graph TD
    A[User navigates to /products] --> B[Container Route Handler]
    B --> C[Module Federation]
    C --> D[Fetch products/remoteEntry.js]
    D --> E[Load Products Vue App]
    E --> F[Products subscribes to RxJS store]
    F --> G[Products renders with current state]
```

Each microfrontend follows this pattern:
- **Lazy Loading** - Only loads when user navigates to that route
- **State Subscription** - Immediately subscribes to relevant parts of global state
- **Independent Rendering** - Renders based on its current props and global state

#### 3. Cross-Microfrontend Communication

The magic happens through the RxJS Global Store:

```mermaid
graph TD
    A[Products: Add to Cart] --> B[RxJS Store: addToCart method]
    B --> C[Store: Dispatch ADD_TO_CART action]
    C --> D[Store: Update cart state via reducer]
    D --> E[BehaviorSubject: Emit new state]
    
    E --> F[Container Header: Re-render cart count]
    E --> G[Products: Update button to quantity controls]
    E --> H[Cart: Update items list if loaded]
    E --> I[localStorage: Persist state]
```

**Key Points:**
- **Single Source of Truth** - All state lives in one RxJS store
- **Reactive Updates** - Changes propagate automatically to all subscribers
- **Framework Agnostic** - Works with React, Vue, or any other framework
- **Persistence** - State survives page refreshes and browser restarts

#### 4. Smart UI State Management

The application features intelligent UI that adapts based on global state:

**Products Page Button Logic:**
```typescript
// In Products Vue component
const isInCart = computed(() => {
  return cartState.value.some(item => item.productId === product.id);
});

// Template renders different UI based on cart state
<template>
  <button v-if="!isInCart" @click="addToCart">
    Add to Cart
  </button>
  <div v-else class="quantity-controls">
    <button @click="decreaseQuantity">-</button>
    <span>{{ productQuantity }}</span>
    <button @click="increaseQuantity">+</button>
  </div>
</template>
```

#### 5. Data Persistence Strategy

The application uses a hybrid approach for optimal user experience:

**RxJS (In-Memory):**
- Instant reactive updates
- Real-time UI synchronization
- Observable streams for component subscriptions

**localStorage (Persistent):**
- Survives page refreshes
- Maintains user session across browser restarts
- Enables cross-tab synchronization

```mermaid
graph TD
    A[User Action] --> B[RxJS Store Update]
    B --> C[Immediate UI Update]
    B --> D[localStorage Persistence]
    
    E[Page Refresh] --> F[RxJS Store Init]
    F --> G[Load from localStorage]
    G --> H[Restore Previous State]
    H --> I[UI Shows Saved Data]
```

#### 6. Authentication Flow

Authentication state is managed globally and affects all microfrontends:

```mermaid
stateDiagram-v2
    [*] --> NotAuthenticated
    NotAuthenticated --> LoginForm: Navigate to /auth
    LoginForm --> Authenticating: Submit credentials
    Authenticating --> Authenticated: API success
    Authenticating --> LoginError: API failure
    LoginError --> LoginForm: Show error message
    
    Authenticated --> ProfileView: Show in Auth MF
    Authenticated --> HeaderUpdate: Show user info in Container
    Authenticated --> CartAccess: Enable cart features
    
    ProfileView --> LoggingOut: Click logout
    HeaderUpdate --> LoggingOut: Click logout
    LoggingOut --> NotAuthenticated: Clear global state
```

**Authentication State Sync:**
- Login in Auth microfrontend → RxJS store updates → Container header shows user info
- Logout from anywhere → All microfrontends update to show logged-out state
- Page refresh → localStorage restores authentication state

#### 7. Error Handling and Resilience

The system includes multiple layers of error handling:

```mermaid
graph TD
    A[Microfrontend Error] --> B[Error Boundary]
    B --> C[Graceful Fallback UI]
    B --> D[Error Logging]
    
    E[Network Error] --> F[Retry Logic]
    F --> G[Show Error State]
    
    H[Module Federation Failure] --> I[Loading Fallback]
    I --> J[Retry Button]
```

**Error Recovery:**
- **Error Boundaries** - Catch microfrontend crashes and show fallback UI
- **Network Resilience** - Retry failed API calls automatically
- **Graceful Degradation** - App continues working even if one microfrontend fails
- **User Feedback** - Clear error messages with actionable recovery options

### Why This Architecture Works

1. **Independent Development** - Teams can work on different microfrontends simultaneously
2. **Technology Diversity** - Mix React and Vue in the same application
3. **Scalable State Management** - RxJS handles complex state updates efficiently
4. **Excellent User Experience** - Real-time updates with data persistence
5. **Production Ready** - Error handling, performance optimization, and deployment support

This architecture demonstrates how modern microfrontend principles can create maintainable, scalable applications that provide excellent developer and user experiences.

### Products Microfrontend
- Product listing with responsive cards
- Product detail views
- Smart Add to Cart buttons that transform into quantity controls
- Category filtering and search
- Vue 3 Composition API with reactive state

### Cart Microfrontend
- Add/remove items with real-time updates
- Quantity management with +/- controls
- Automatic price calculation
- Clear all functionality
- Persistent cart state

### Auth Microfrontend
- User login/logout with session management
- User profile display with stats
- Secure authentication flow
- Profile view with user information

### Global Features
- Real-time cross-microfrontend communication
- Centralized state management with RxJS
- Automatic data persistence
- Error boundaries and graceful fallbacks

## Smart UI Enhancement

The application features intelligent UI that adapts based on cart state:

```
Product NOT in cart: [ Add to Cart ]
Product IN cart:     [ - ] [ 2 ] [ + ]
                         ↑    ↑   ↑
                    Decrease │ Increase
                           Current Qty
```

This provides immediate feedback and eliminates the need to navigate to the cart page for quantity adjustments.

## Technology Stack

### Frontend Frameworks
- **React 18** - Container, Cart, Auth microfrontends
- **Vue 3** - Products microfrontend with Composition API
- **TypeScript** - Type safety across all applications

### State Management
- **RxJS** - Reactive global state management
- **Pinia** - Vue-specific store for Products app
- **React Context** - Local state management

### Build Tools
- **Webpack 5** - Module bundling and federation
- **Module Federation** - Runtime microfrontend integration
- **Babel** - JavaScript transpilation

### Styling
- **Tailwind CSS** - Utility-first styling
- **PostCSS** - CSS processing

## Project Structure

```
microfrontend/
├── container/          # Host application (React)
│   ├── src/
│   │   ├── components/    # Header, Navigation, Error Boundaries
│   │   ├── hooks/         # useRxJSStore (React hooks)
│   │   ├── contexts/      # AppContextRxJS
│   │   └── pages/         # Home page
│   └── webpack.config.js  # Module Federation config
├── products/           # Products microfrontend (Vue)
│   ├── src/
│   │   ├── components/    # ProductCard, ProductDetail
│   │   ├── composables/   # useRxJSStore (Vue composables)
│   │   ├── stores/        # Pinia store
│   │   └── router/        # Vue router
│   └── webpack.config.js
├── cart/               # Cart microfrontend (React)
│   ├── src/
│   │   ├── components/    # Cart items, quantity controls
│   │   ├── contexts/      # CartContextRxJS
│   │   └── hooks/         # useRxJSStore
│   └── webpack.config.js
├── auth/               # Authentication (React)
│   ├── src/
│   │   ├── components/    # LoginForm, ProfileView
│   │   ├── contexts/      # AuthContext
│   │   └── hooks/         # useRxJSStore
│   └── webpack.config.js
├── shared/             # Shared library
│   ├── src/
│   │   ├── store/         # RxJS Global Store
│   │   ├── utils/         # Storage utilities
│   │   ├── types/         # TypeScript interfaces
│   │   └── api/           # API functions
│   └── package.json
└── scripts/            # Build and deployment scripts
```

## Getting Started

### Prerequisites
- Node.js 16+
- npm 8+

### Installation

```bash
# Install root dependencies
npm install

# Install all microfrontend dependencies
npm run install:all
```

### Development

Start all services in development mode:

```bash
# Terminal 1: Build shared library in watch mode
cd shared && npm run dev

# Terminal 2: Container (Port 3000)
cd container && npm start

# Terminal 3: Products (Port 3001)
cd products && npm start

# Terminal 4: Cart (Port 3002)
cd cart && npm start

# Terminal 5: Auth (Port 3003)
cd auth && npm start
```

Open http://localhost:3000

### Production Build

Build all microfrontends for deployment:

```bash
npm run build:all
```

This creates a single `dist/` directory containing all microfrontends optimized for static hosting.

## Deployment

### Vercel/Netlify Deployment

The project includes a `vercel.json` configuration for seamless deployment:

```mermaid
flowchart TD
    Build[npm run build:all] --> Dist[Single dist/ directory]
    Dist --> Vercel[Vercel/Netlify]
    Vercel --> Live[Live application]
    
    subgraph "Build Process"
        Individual[Build each MF] --> Copy[Copy to dist/]
        Copy --> Structure["dist/<br/>├── index.html<br/>├── products/<br/>├── cart/<br/>└── auth/"]
    end
```

Key deployment features:
- Single build output directory
- Proper MIME types for JavaScript files
- SPA routing support (all routes serve index.html)
- CORS headers for microfrontend loading

## Development Workflow

### Adding Features

1. **Products enhancements:**
   ```bash
   cd products
   # Edit Vue components
   # Use useRxJSStore composables for state
   ```

2. **Cart functionality:**
   ```bash
   cd cart
   # Edit React components
   # State automatically syncs via RxJS
   ```

3. **Global state changes:**
   ```bash
   cd shared
   # Edit store/GlobalStore.ts
   # All apps receive updates automatically
   ```

## Key Concepts

### Reactive Programming
- **Observable Streams** - Data flows reactively through the application
- **Automatic Updates** - Change state in one place, updates propagate everywhere
- **Real-time Sync** - No manual refresh required

### Module Federation
- **Code Sharing** - Share dependencies and utilities between apps
- **Independent Deployment** - Deploy microfrontends independently
- **Runtime Integration** - Apps are composed at runtime, not build time

### Microfrontend Benefits
- **Team Independence** - Different teams can own different microfrontends
- **Technology Freedom** - Mix React, Vue, Angular in the same application
- **Scalability** - Add new features as separate microfrontends

## State Management

The RxJS Global Store manages all shared state:

```mermaid
graph LR
    Store[RxJS Global Store] --> User[User State]
    Store --> Cart[Cart Items]
    Store --> Products[Product Catalog]
    Store --> Loading[Loading States]
    Store --> Errors[Error States]
    
    Store --> Persistence[localStorage]
```

### Store Structure
```typescript
interface GlobalState {
  user: User | null;
  cart: CartItem[];
  products: Product[];
  loading: boolean;
  error: string | null;
}
```

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   npx kill-port 3000
   ```

2. **Module Not Found:**
   ```bash
   cd shared && npm run build
   ```

3. **State Not Syncing:**
   - Verify globalStore.dispatch() calls
   - Check RxJS subscriptions in hooks/composables

4. **Hot Reload Issues:**
   ```bash
   # Restart the specific microfrontend
   ```

5. **Deployment 404 Errors:**
   - Ensure vercel.json routes all paths to index.html
   - Verify remoteEntry.js files are served with correct MIME type

## Success Metrics

When the application is working correctly:

- Products load instantly
- Add to Cart works seamlessly across microfrontends
- Quantity controls appear immediately after adding items
- Cart count updates in header in real-time
- Prices calculate correctly
- Login/logout works smoothly
- No console errors
- Data persists across page refreshes

## Performance Considerations

- **Shared Dependencies** - React and Vue are shared to avoid duplication
- **Lazy Loading** - Microfrontends load on demand
- **Code Splitting** - Each microfrontend bundles independently
- **Caching** - Static assets are cached with appropriate headers

## Future Enhancements

1. Add new microfrontends (Orders, Reviews, Analytics)
2. Implement advanced caching strategies
3. Add comprehensive testing suite
4. Set up CI/CD pipeline
5. Add monitoring and analytics

## Resources

- [Module Federation Documentation](https://webpack.js.org/concepts/module-federation/)
- [RxJS Guide](https://rxjs.dev/guide/overview)
- [Microfrontend Architecture](https://micro-frontends.org/)
- [Vue 3 Composition API](https://vuejs.org/guide/composition-api-introduction.html)

## License

MIT License - This project is for demonstration purposes.

---

**Built with modern frontend architecture principles focusing on scalability, maintainability, and developer experience.**