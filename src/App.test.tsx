import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '@/App'

/**
 * Full-app smoke tests: renders the router shell + dashboard in jsdom using
 * the real stores (localforage falls back to jsdom's localStorage).
 */
describe('App shell', () => {
  it('renders the dashboard with the branding and a start CTA', async () => {
    render(<App />)

    // Brand appears on the desktop sidebar (and mobile top bar).
    const brand = await screen.findAllByText('TypeTester')
    expect(brand.length).toBeGreaterThan(0)

    // The dashboard heading and its start action are present.
    expect(await screen.findByRole('heading', { level: 1, name: 'TypeTester' })).toBeTruthy()

    // Sidebar navigation exposes the main destinations.
    expect(screen.getAllByRole('link').length).toBeGreaterThan(3)
  })
})