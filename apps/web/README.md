# Uply Web App

A modern, brutalist-themed website monitoring dashboard built with Next.js 15 and React 19.

## Features

### ✅ Implemented
- **Authentication System**
  - JWT-based login/signup
  - Protected routes
  - Persistent auth state
  - Auto token validation

- **Dashboard**
  - Real-time monitoring stats
  - Website overview cards
  - Recent activity feed
  - Responsive design

- **Website Management**
  - Add websites with URL validation
  - Website status indicators (UP/DOWN/UNKNOWN)
  - Delete websites with confirmation
  - Individual website detail pages

- **Neo-Brutalist UI**
  - Bold typography and stark contrasts
  - Thick borders and geometric shapes
  - Custom shadcn/ui components
  - Dark/light theme support

- **User Experience**
  - Toast notifications
  - Loading states
  - Error boundaries
  - Mobile-responsive design

### 🚧 Planned Features
- Real-time WebSocket updates
- Response time charts
- Email notifications
- Bulk website operations
- Advanced filtering and search
- Custom monitoring intervals

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19
- **Styling**: Tailwind CSS + CSS Modules
- **UI Components**: shadcn/ui (customized)
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + Custom hooks
- **HTTP Client**: Fetch API with custom wrapper
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Typography**: Inter + JetBrains Mono

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Backend API running on port 3001

### Installation

1. Install dependencies:
```bash
bun install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Update environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the development server:
```bash
bun dev
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── dashboard/
│   │   └── websites/
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── dashboard/         # Dashboard-specific components
│   ├── websites/          # Website management components
│   └── ui/               # Reusable UI components (shadcn/ui)
├── contexts/             # React contexts
│   └── auth-context.tsx  # Authentication context
├── hooks/                # Custom React hooks
│   ├── useDashboard.ts   # Dashboard data hook
│   └── useWebsites.ts    # Website management hook
├── lib/                  # Utility libraries
│   ├── api.ts           # API client
│   ├── utils.ts         # General utilities
│   └── validations.ts   # Zod schemas
└── types/               # TypeScript type definitions
    ├── auth.ts          # Authentication types
    └── website.ts       # Website types
```

## API Integration

The app integrates with the backend API through a centralized client (`src/lib/api.ts`):

### Authentication Endpoints
- `POST /user/signup` - User registration
- `POST /user/signin` - User login
- `GET /user/profile` - Get user profile

### Website Endpoints
- `GET /websites` - List user's websites
- `POST /website` - Add new website
- `DELETE /website/:id` - Remove website
- `GET /status/:websiteId` - Get website status
- `GET /dashboard` - Get dashboard data

## Styling & Theming

The app uses a custom neo-brutalist theme with:

- **Colors**: High contrast black/white with accent colors
- **Typography**: Bold, sans-serif fonts (Inter + JetBrains Mono)
- **Borders**: Thick 4px borders throughout
- **Shadows**: Geometric drop shadows
- **Spacing**: Generous whitespace and padding

### Theme Customization

Colors and styling can be customized in:
- `src/app/globals.css` - CSS custom properties
- `tailwind.config.js` - Tailwind configuration

## Development

### Adding New Components

1. Create component in appropriate directory
2. Follow naming convention: `kebab-case.tsx`
3. Use TypeScript interfaces for props
4. Apply brutalist styling patterns

### Adding New Pages

1. Create page in `src/app/` directory
2. Use appropriate route groups: `(auth)` or `(dashboard)`
3. Add to navigation if needed

### State Management

- **Authentication**: Global context (`AuthProvider`)
- **Server State**: Custom hooks with API calls
- **UI State**: Local component state
- **Forms**: React Hook Form with Zod validation

## Building for Production

```bash
bun run build
```

The optimized build will be created in the `.next` directory.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Uply` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | App description | `Website Monitoring Service` |

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Test components in both light and dark themes
4. Ensure mobile responsiveness
5. Add proper error handling

## License

This project is part of the Uply monitoring service.