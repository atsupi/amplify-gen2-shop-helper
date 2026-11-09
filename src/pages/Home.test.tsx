import { render, screen } from '@testing-library/react'
import Home from './Home'

describe('Home', () => {
    it('renders home heading', () => {
        render(<Home />)
        expect(screen.getByRole('heading', { name: 'Home Page'})).toBeInTheDocument()
    })
})
