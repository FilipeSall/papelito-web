export type CompactTableProps = {
  headers: string[];
  rows: React.ReactNode[][];
};

export function CompactTable({ headers, rows }: CompactTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-[#231f20]/12 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${headers[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className="border-b border-[#231f20]/8 px-4 py-3 text-sm text-[#231f20]/78"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
