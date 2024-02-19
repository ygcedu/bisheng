
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/ui/button";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../../../components/ui/select1";
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/toggle-group";
import { getServicesApi } from "../../../controllers/API";

interface IProps {
    onChange: (type, rt) => void,
    rtClick: () => void,
    onCreate: () => void,
}
export default function FinetuneHead({ onChange, rtClick, onCreate }: IProps) {
    const { t } = useTranslation()

    const [type, setType] = useState('all')
    const [rt, setRt] = useState('all')

    const handleTypeChange = (val) => {
        setType(val)
        onChange(val, rt)
    }

    const handleRtChange = (val) => {
        setRt(val)
        onChange(type, val)
    }

    // rts
    const [services, setServices] = useState([])
    useEffect(() => {
        getServicesApi().then(res => {
            setServices(res.map(el => ({
                id: el.id,
                name: el.server,
                url: el.endpoint
            })))
        })

        onChange(type, rt)
    }, [])

    return <div className="flex justify-between pb-4 border-b">
        <div className="flex gap-4">
            <ToggleGroup type="single" defaultValue={type} onValueChange={handleTypeChange} className="border rounded-md">
                <ToggleGroupItem value="all">{t('finetune.all')}</ToggleGroupItem>
                <ToggleGroupItem value="4">{t('finetune.successful')}</ToggleGroupItem>
                <ToggleGroupItem value="1">{t('finetune.inProgress')}</ToggleGroupItem>
                <ToggleGroupItem value="2">{t('finetune.failedAborted')}</ToggleGroupItem>
            </ToggleGroup>
            <Select defaultValue={rt} onValueChange={handleRtChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="all">{t('finetune.all')}</SelectItem>
                        {
                            services.map(service => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)
                        }
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
        <div className="flex gap-4">
            <Button size="sm" className="rounded-full h-8" onClick={onCreate}>{t('finetune.createTrainingTask')}</Button>
            <Button size="sm" className="rounded-full h-8 bg-gray-500" onClick={rtClick}>{t('finetune.rtServiceManagement')}</Button>
        </div>
    </div>
};