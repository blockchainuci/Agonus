export default function DashboardHeader() {
  return (
    <div className="border border-white/10 rounded-xl p-6 flex flex-col gap-2">
      <h2 className="text-2xl font-semibold text-white">Welcome Back</h2>
      <p className="text-gray-400 text-sm">
        Connected Wallet: <span className="text-white">0x1234...abcd</span>
      </p>
    </div>
  );
}
