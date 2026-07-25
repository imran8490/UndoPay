"use client";

import WalletConnect from "@/components/WalletConnect";
import SendPaymentCard from "@/components/SendPaymentCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1120] text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold text-blue-500">
            UndoPay
          </h1>

          <WalletConnect />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left */}
          <div>

            <span className="rounded-full bg-blue-600/20 px-4 py-2 text-sm text-blue-400">
              Web3 Escrow Payments
            </span>

            <h1 className="mt-6 text-5xl font-bold leading-tight">
              Crypto Payments
              <span className="text-blue-500">
                {" "}with a Second Chance
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-400">
              UndoPay protects crypto transfers with a 30-second escrow
              reclaim window. If you accidentally enter the wrong wallet
              address, you can reclaim your funds before the transfer
              becomes final.
            </p>

            <div className="mt-10 flex gap-4">

              <button className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
                Launch App
              </button>

              <button className="rounded-xl border border-gray-700 px-6 py-3 hover:border-blue-500">
                Learn More
              </button>

            </div>

          </div>

          {/* Right */}
          <div className="flex justify-center">
            <SendPaymentCard />
          </div>

        </div>

      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 pb-20">

        <h2 className="mb-10 text-center text-3xl font-bold">
          Why UndoPay?
        </h2>

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-3 text-xl font-semibold">
              🔒 Escrow Protection
            </h3>

            <p className="text-gray-400">
              Funds are securely locked in a smart contract before being
              released.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-3 text-xl font-semibold">
              ⏳ 30-Second Reclaim Window
            </h3>

            <p className="text-gray-400">
              Recover your payment if you notice a mistake before the timer
              expires.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h3 className="mb-3 text-xl font-semibold">
              ⚡ Automatic Release
            </h3>

            <p className="text-gray-400">
              Once the reclaim window ends, the smart contract releases the
              payment automatically.
            </p>
          </div>

        </div>

      </section>

      {/* How It Works */}
      <section className="border-t border-gray-800 bg-[#101827] py-20">

        <div className="mx-auto max-w-5xl px-6">

          <h2 className="mb-12 text-center text-3xl font-bold">
            How It Works
          </h2>

          <div className="grid gap-6 md:grid-cols-5 text-center">

            <div>
              <div className="text-4xl">👛</div>
              <p className="mt-3">Connect Wallet</p>
            </div>

            <div>
              <div className="text-4xl">💸</div>
              <p className="mt-3">Send Payment</p>
            </div>

            <div>
              <div className="text-4xl">🔒</div>
              <p className="mt-3">Escrow Lock</p>
            </div>

            <div>
              <div className="text-4xl">⏳</div>
              <p className="mt-3">30s Timer</p>
            </div>

            <div>
              <div className="text-4xl">✅</div>
              <p className="mt-3">Reclaim or Release</p>
            </div>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500">
        © 2026 UndoPay • Built on Arc
      </footer>

    </main>
  );
}
