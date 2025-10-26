import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const DailyCards = ({
  number,
  title,
  increment,
}: {
  number: number;
  title: string;
  increment: number;
}) => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-white rounded-3xl">
      <h2 className="font-semibold">{title}</h2>
      <h1 className="text-3xl font-bold">{number}</h1>

      <div className="flex gap-2 items-center">
        {increment > 0 ? (
          <>
            <div className="flex gap-1 items-center border border-green-500 rounded-3xl px-2">
              <h3 className="text-sm font-semibold">{increment}</h3>
              <ArrowUpRight className="text-green-500 w-4 h-4" />
            </div>
            <span className="text-sm ">from yesterday</span>
          </>
        ) : (
          <>
            <div className="flex gap-1 items-center border border-red-500 rounded-lg px-2">
              <h3 className="text-sm font-semibold">{Math.abs(increment)}</h3>
              <ArrowDownRight className="text-red-500 w-4 h-4" />
            </div>
            <span className="text-sm">from yesterday</span>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyCards;
