export default function HalEye() {
  return (
    <div className="h-[80%] aspect-1/3 flex flex-col p-[0.5%] bg-linear-to-t from-neutral-600 via-neutral-500 to-gray-300 shadow-[0_0_10vw_0] shadow-stone-800">
      <div className="bg-zinc-950 h-3/4 flex flex-col">
        <div className="flex bg-zinc-950 p-[6%] items-center font-hal">
          <div className="w-1/2 pr-[2%] bg-sky-700 text-sky-200 text-right tracking-wider">
            H.A.L.
          </div>
          <div className="w-1/2 pl-[2%] bg-black border-[0.125vw] border-neutral-600 text-yellow-400 opacity-50">
            9000
          </div>
        </div>
        <div className="px-[6%] py-[12%] mt-auto">
          <div className="rounded-full aspect-square p-[1.5%] bg-linear-to-t from-neutral-700 via-neutral-600 to-gray-300">
            <div className="rounded-full aspect-square p-[3%] bg-linear-to-t from-neutral-900 via-neutral-980 to-gray-500">
              <div className="rounded-full aspect-square bg-zinc-950 flex items-center justify-center relative">
                <div className="absolute h-[3%] rounded-full aspect-square bg-radial from-white to-transparent top-[38%] left-[40%]"></div>
                <div className="absolute h-[2%] w-[8%] rounded-full aspect-square bg-radial from-white to-transparent top-[8%] left-[25%] rotate-153"></div>
                <div className="absolute h-[2%] w-[8%] rounded-full aspect-square opacity-90 bg-radial from-white to-transparent bottom-[8%] right-[25%] rotate-153"></div>
                <div className="rounded-full aspect-square bg-linear-to-t from-rose-900 via-rose-600 to-rose-300 h-[6%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-1/4 mt-auto bg-linear-to-br from-stone-950 via-stone-900 to-stone-800 shadow-inner">
        <div className="h-[2.5%] bg-linear-to-t from-neutral-700 via-neutral-600 to-gray-300"></div>
      </div>
    </div>
  );
}