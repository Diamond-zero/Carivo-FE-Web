import { CalendarCheck, Car } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { publicNavItems } from '../data/publicHomeData'

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
            <Car className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-black uppercase">Carivo</span>
            <span className="block text-[11px] font-semibold text-brand-200">
              Wash & Detailing
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-200 md:flex">
          {publicNavItems.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Staff
            </Button>
          </Link>
          <a href="#booking">
            <Button size="sm">
              <CalendarCheck className="h-4 w-4" />
              Đặt hẹn
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
