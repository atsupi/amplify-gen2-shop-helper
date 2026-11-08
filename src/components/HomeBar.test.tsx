import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeBar from './HomeBar'

describe('HomeBar', () => {
    it('renders navigation links', () => {
        render(
            <MemoryRouter>
                <HomeBar />
            </MemoryRouter>
        )

        expect(screen.getByRole('link', { name: 'Home'})).toHaveAttribute('href', '/')
        expect(screen.getByRole('link', { name: 'Register'})).toHaveAttribute('href', '/register')
        expect(screen.getByRole('link', { name: 'Shop'})).toHaveAttribute('href', '/shop')
        expect(screen.getByRole('link', { name: 'Cart'})).toHaveAttribute('href', '/cart')
        expect(screen.getByRole('link', { name: 'Purchase'})).toHaveAttribute('href', '/purchase')
    })
})