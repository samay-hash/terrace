import styles from "./SizeTable.module.css";

export const SIZE_CHART = [
  { size: "XS", chest: "86–91", length: "68" },
  { size: "S", chest: "91–96", length: "70" },
  { size: "M", chest: "96–101", length: "72" },
  { size: "L", chest: "101–106", length: "74" },
  { size: "XL", chest: "106–112", length: "76" },
  { size: "XXL", chest: "112–118", length: "78" },
];

export function SizeTable() {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="visually-hidden">Size chart in centimetres</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th scope="col">Chest (body, cm)</th>
            <th scope="col">Shirt length (cm)</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((row) => (
            <tr key={row.size}>
              <th scope="row">{row.size}</th>
              <td className="tabular">{row.chest}</td>
              <td className="tabular">{row.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>
        Measure around the fullest part of your chest. Between sizes? Size down for retro shirts (they're cut boxier) and up for
        current-season kits.
      </p>
    </div>
  );
}
