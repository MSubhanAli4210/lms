## Learnspace LMS

Learnspace is a full-stack learning management system built with Next.js, MongoDB, Tailwind CSS, and Stripe Checkout.

### Included

- Admin course, category, lesson, and user management
- Responsive authenticated sidebar for learners and admins
- Published course catalog and course detail pages
- Free enrollment and paid course checkout
- Stripe webhook activation for successful payments
- Admin video uploads with browser streaming through HTML video controls

### Setup

Copy `.env.example` to `.env.local` and provide your MongoDB, auth, and Stripe values.

```bash
npm install
npm run dev
```

For local Stripe testing, forward events to the webhook route:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Use the generated webhook signing secret as `STRIPE_WEBHOOK_SECRET`. Paid checkout requires `STRIPE_SECRET_KEY`; free courses enroll immediately without Stripe.

Video uploads are stored in `public/uploads` for local development. For production deployments with ephemeral filesystems, replace the storage block in `app/api/uploads/video/route.ts` with S3, Cloudinary, or another durable object store while returning the same public URL.

### Validation

```bash
npm run lint
npm run build
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
