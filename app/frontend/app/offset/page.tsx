import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default function CarbonOffsetSection() {
  return (
    <div className="container mx-auto py-12 space-y-8">
      <div className="pb-2">
        <Link href="/dashboard">
          <MoveLeft className="cursor-pointer" />
        </Link>
      </div>
      <h2 className="text-3xl font-semibold text-gray-800">
        Offset Your Carbon Footprint
      </h2>
      <h4 className="text-xl font-semibold mt-8 mb-4">
        Donate to Reputable Organisations
      </h4>
      <p className="mb-4 ml-2">
        If you’re in a position to donate, supporting organisations that
        directly mitigate carbon emissions or restore ecosystems can make a
        meaningful impact.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>
          <strong>Clean Air Task Force</strong> – Donating supports CATF’s work
          to rapidly deploy low-carbon energy and technologies to reduce climate
          impact.{" "}
          <a
            className="text-teal-600 hover:underline"
            href="https://www.catf.us/donate/"
            target="_blank"
            rel="noopener noreferrer"
          >
            catf.us/donate
          </a>
        </li>
        <li>
          <strong>Climate Action Network-International</strong> – A global
          network of over 1,800 NGOs in 130+ countries fighting the climate
          crisis through advocacy and social justice.{" "}
          <a
            className="text-teal-600 hover:underline"
            href="https://climatenetwork.org/get-involved/support/"
            target="_blank"
            rel="noopener noreferrer"
          >
            climatenetwork.org/get-involved/support
          </a>
        </li>
        <li>
          <strong>Carbonfund.org Foundation</strong> – US-based nonprofit
          specialising in renewable energy, reforestation and energy-efficiency
          offset projects.
        </li>
      </ul>

      <h4 className="text-xl font-semibold mt-12 mb-4">
        Volunteer & Get Involved
      </h4>
      <p className="mb-4 ml-2">
        Donating money is one option, but donating your time or skills can also
        make a big difference.
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>
          Join a tree-planting or habitat restoration event in your local
          community.
        </li>
        <li>
          Volunteer with international organisations such as Ecologists Without
          Borders (global project opportunities).
        </li>
        <li>
          Offer your skills (e.g., communications, data tracking, outreach) to
          non-profits working on climate or ecosystem projects.
        </li>
      </ul>

      <h4 className="text-xl font-semibold mt-12 mb-4">
        Free & Low-Cost Lifestyle Changes
      </h4>
      <p className="mb-4 ml-2">
        Here are actionable tips you can implement right away to reduce your
        footprint without spending money.
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>
          <strong>Reduce household energy use:</strong> Unplug unused devices,
          switch to LED bulbs, adjust your thermostat slightly.
        </li>
        <li>
          <strong>Choose greener transport:</strong> Walk, bike, car-pool or use
          public transit when possible.
        </li>
        <li>
          <strong>Eat more plants:</strong> Try having one plant-based day per
          week and reduce red meat consumption.
        </li>
        <li>
          <strong>Embrace reuse & circular habits:</strong> Repair instead of
          replace, buy fewer new items, recycle where possible.
        </li>
        <li>
          <strong>Get involved locally:</strong> Join a local restoration or
          clean-up event in your area.
        </li>
      </ol>
    </div>
  );
}
