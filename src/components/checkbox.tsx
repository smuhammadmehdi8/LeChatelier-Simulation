
interface CheckboxProps {
    name: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function Checkbox({name, label, checked, onChange} : CheckboxProps) {
    return (
        <div className="checkbox-container"> 
            <input type="checkbox" 
                   id={name} 
                   name={name} 
                   checked={checked}
                   onChange={(event) => {
                    onChange(event.target.checked);
                   }}
            />
            <label htmlFor={name}>{label}</label>
        </div>
    )
}