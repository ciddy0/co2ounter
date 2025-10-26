import { EqualApproximately } from "lucide-react";

const CO2Card = ({
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
            <div className="flex gap-1 items-center border border-gray-500 rounded-lg px-2">
              <EqualApproximately className="text-gray-500 w-4 h-4" />
              <h3 className="text-sm font-semibold">{Math.abs(increment)}</h3>
            </div>
            <span className="text-sm ">g/day</span>
          </>
        ) : (
          <>
            <div className="flex gap-1 items-center border border-gray-500 rounded-lg px-2">
              <EqualApproximately className="text-gray-500 w-4 h-4" />
              <h3 className="text-sm font-semibold">{Math.abs(increment)}</h3>
            </div>
            <span className="text-sm">g/day</span>
          </>
        )}
      </div>
    </div>
  );
};

export default CO2Card;
