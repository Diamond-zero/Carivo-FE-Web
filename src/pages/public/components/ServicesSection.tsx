import { Clock } from 'lucide-react'
import { publicServices } from '../data/publicHomeData'

export function ServicesSection() {
  return (
    <section id="services" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-brand-700">Chăm sóc xe</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">
              Dịch vụ phổ biến
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Các gói được thiết kế theo ServicePackage để sau này backend có thể quản lý
            giá, thời lượng, điểm thưởng và quy trình thực hiện.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {publicServices.map((service) => (
            <article
              key={service.name}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-[var(--shadow-carivo-sm)] transition-transform hover:-translate-y-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <service.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black text-slate-950">{service.name}</h3>
              <p className="mt-2 min-h-18 text-sm leading-6 text-slate-600">
                {service.description}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-black text-brand-700">{service.price}</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {service.time}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
