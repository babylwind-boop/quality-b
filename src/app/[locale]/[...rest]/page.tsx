import { notFound } from 'next/navigation';

/** Catch-all: unknown paths render the locale-aware 404. */
export default function CatchAll() {
  notFound();
}
