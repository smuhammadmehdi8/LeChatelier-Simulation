interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export default function Dropdown({label, value, options, onChange, disabled = false}: DropdownProps) {
    return (
        <div className="dropdown-container">
        <div className="dropdown-wrapper">
            <select
            className="dropdown-select"
            value={value}
            onChange={(event) => {
                onChange(event.target.value);
            }}
            disabled={disabled}
            >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                {option.label}
                </option>
            ))}
            </select>

            <label className="dropdown-label">{label}</label>
        </div>
        </div>
    );
    }
