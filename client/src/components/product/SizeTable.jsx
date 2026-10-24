import styles from "./SizeTable.module.css";

const CLOTHING = [
  ["XS", "86–91", "71–76"],
  ["S", "91–96", "76–81"],
  ["M", "96–101", "81–86"],
  ["L", "101–106", "86–91"],
  ["XL", "106–112", "91–97"],
  ["XXL", "112–118", "97–103"],
];

const SHOES = [
  ["UK 3", "EU 36", "US 5 (W)", "22.0"],
  ["UK 4", "EU 37", "US 6 (W)", "23.0"],
  ["UK 5", "EU 38", "US 7 (W)", "23.7"],
  ["UK 6", "EU 39", "US 7 (M)", "24.5"],
  ["UK 7", "EU 41", "US 8 (M)", "25.4"],
  ["UK 8", "EU 42", "US 9 (M)", "26.2"],
  ["UK 9", "EU 43", "US 10 (M)", "27.1"],
  ["UK 10", "EU 44.5", "US 11 (M)", "27.9"],
  ["UK 11", "EU 46", "US 12 (M)", "28.8"],
];

function Table({ caption, head, rows }) {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([first, ...rest]) => (
            <tr key={first}>
              <th scope="row">{first}</th>
              {rest.map((cell, i) => (
                <td key={i} className="tabular">
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

export function SizeTable({ kind = "clothing" }) {
  if (kind === "shoes") {
    return (
      <div className={styles.wrap}>
        <Table caption="Shoe size conversion" head={["UK", "EU", "US", "Foot length (cm)"]} rows={SHOES} />
        <p className={styles.note}>
          Stand on a sheet of paper, mark your heel and longest toe, and measure. Between sizes in trainers? Go half a size up. Heels
          run true to size.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.wrap}>
      <Table caption="Clothing sizes in centimetres" head={["Size", "Chest (cm)", "Waist (cm)"]} rows={CLOTHING} />
      <p className={styles.note}>Measure around the fullest part of your chest with the tape level. Our shirts and dresses are a regular fit.</p>
    </div>
  );
}

// Which chart fits a product, from its size labels.
export function sizeKind(sizes) {
  if (sizes.some((s) => s.label.startsWith("UK "))) return "shoes";
  if (sizes.some((s) => ["XS", "S", "M", "L", "XL", "XXL"].includes(s.label))) return "clothing";
  return null;
}
