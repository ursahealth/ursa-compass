import { Check, Session, Step } from "../util/types";

export const CheckPanel = ({
  session,
  step,
  check,
}: {
  session: Session;
  step: Step;
  check: Check;
}) => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white rounded-xl shadow-md border border-gray-200">
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-700">{step.name}</h2>
        <h1 className="text-2xl font-semibold text-gray-800">{check.name}</h1>
        <p className="text-gray-600">{check.description}</p>
      </div>

      <div className="space-y-4">
        <section>
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-1 mb-2">AI Log</h3>
          <button
            type="button"
            className="px-4 py-2 bg-green-pine text-white rounded-md hover:bg-green-forest focus:outline-none focus:ring-2 focus:ring-green-pine"
          >
            Start AI Chat
          </button>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-1 mb-2">Evidence</h3>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 border">
            Evidence goes here
          </div>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-1 mb-2">Resolution</h3>
          <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700 border">
            Resolution here.
          </div>
        </section>
      </div>
    </div>
  );
};