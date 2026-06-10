
interface CheckboxProps {
    name: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export default function Checkbox({name, label, checked, onChange, disabled = false} : CheckboxProps) {
    return (
        <div className="checkbox-container"> 
            <input type="checkbox" 
                   id={name} 
                   name={name} 
                   checked={checked}
                   onChange={(event) => {
                    onChange(event.target.checked);
                   }}
                   disabled={disabled}
            />
            <label htmlFor={name}>{label}</label>
        </div>
    )
}