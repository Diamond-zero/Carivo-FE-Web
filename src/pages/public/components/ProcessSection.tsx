import { processSteps } from '../data/publicHomeData'

export function ProcessSection() {
  return (
    <section className="bg-slate-950 py-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-bold uppercase text-brand-200">Quy trình chuẩn</p>
          <h2 className="mt-2 text-3xl font-black">Từ check-in đến thanh toán</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Flow này khớp với phần backend: check-in, inspection, wash bay, service step,
            complete service, mark paid và cộng điểm.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {processSteps.map((step, index) => (
            <div key={step} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <span className="text-xs font-black text-brand-300">
                STEP {String(index + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-100">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
