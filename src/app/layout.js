import './globals.css'

export const metadata = {
  title: 'Solar System Simulator',
  description: '3D Solar System with Earth, Moon and Satellite orbits',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black">{children}</body>
    </html>
  )
}