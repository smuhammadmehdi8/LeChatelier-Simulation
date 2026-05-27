
interface CheckboxProps {
    name: string;
    label: string;
}

export default function Checkbox({name, label} : CheckboxProps) {
    return (
        <div className="checkbox-container"> 
            <input type="checkbox" id={name} name={name} value={label}/>
            <label htmlFor={name}>{label}</label>
        </div>
    )
}