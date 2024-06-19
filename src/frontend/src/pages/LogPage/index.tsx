import { Button } from "@/components/bs-ui/button";
import { DatePicker } from "@/components/bs-ui/calendar/datePicker";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/bs-ui/select";
import MultiSelect from "@/components/bs-ui/select/multi";
import { getActionsApi, getActionsByModuleApi, getLogsApi, getModulesApi } from "@/controllers/API/log";
import { getUserGroupsApi, getUsersApi } from "@/controllers/API/user";
import { useTable } from "@/util/hook";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AutoPagination from "../../components/bs-ui/pagination/autoPagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/bs-ui/table";
import { formatDate } from "@/util/utils";

const useGroups = () => {
    const [groups, setGroups] = useState([])
    const loadData = () => {
        getUserGroupsApi().then(res => setGroups(res.records))
    }
    return { groups, loadData }
}
const useModules = () => {
    const [modules, setModules] = useState([])
    const loadModules = () => {
        getModulesApi().then(res => setModules(res.data))
    }
    return { modules, loadModules }
}

export default function index() {
    const { t } = useTranslation()
    const { users, reload, loadMore, searchUser } = useUsers()
    const { groups, loadData } = useGroups()
    const { modules, loadModules } = useModules()
    const { page, pageSize, data: logs, total, setPage, filterData } = useTable({ pageSize: 20 }, (param) =>
        getLogsApi({...param})
    )
    const init = {
        userIds: [],
        groupId: '',
        start: undefined,
        end: undefined,
        moduleId: '',
        action: ''
    }

    const [actions, setActions] = useState<any[]>([])
    const [keys, setKeys] = useState({...init})

    const handleActionOpen = async () => {
        setActions((keys.moduleId ? await getActionsByModuleApi(keys.moduleId) : await getActionsApi()).data)
    }
    const handleSearch = () => {
        const uids = keys.userIds.map(u => u.value)
        const startTime = keys.start ? formatDate(keys.start, 'yyyy-MM-dd HH:mm:ss') : undefined
        const endTime = keys.end ? formatDate(keys.start, 'yyyy-MM-dd HH:mm:ss') : undefined
        filterData({...keys, userIds:uids, start:startTime, end:endTime})
    }
    const handleReset = () => {
        setKeys({...init})
    }

    return <div className="relative">
        <div className="h-[calc(100vh-98px)] overflow-y-auto px-2 py-4 pb-10">
            <div className="flex flex-wrap gap-4">
            <div className="w-[180px] relative">
                <MultiSelect className=" w-full overflow-y-auto" multiple
                    options={users}
                    value={keys.userIds}
                    placeholder={t('log.selectUser')}
                    onLoad={reload}
                    onSearch={searchUser}
                    onScrollLoad={loadMore}
                    onChange={(values) => setKeys({...keys,userIds:values})}
                ></MultiSelect>
            </div>
            <div className="w-[180px] relative">
                <Select onOpenChange={loadData} value={keys.groupId} onValueChange={(value) => setKeys({...keys,groupId:value})}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('log.selectUserGroup')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {groups.map(g => <SelectItem value={g.id} key={g.id}>{g.group_name}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-[180px] relative">
                <DatePicker value={keys.start} placeholder={t('log.startDate')} onChange={(t) => setKeys({...keys,start:t})} />
            </div>
            <div className="w-[180px] relative">
                <DatePicker value={keys.end} placeholder={t('log.endDate')} onChange={(t) => setKeys({...keys,end:t})} />
            </div>
            <div className="w-[180px] relative">
                <Select value={keys.moduleId} onOpenChange={loadModules} onValueChange={(value) => setKeys({...keys,moduleId:value})}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('log.systemModule')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {modules.map(m => <SelectItem value={m.value} key={m.value}>{m.name}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-[180px] relative">
                <Select value={keys.action} onOpenChange={handleActionOpen} onValueChange={(value) => setKeys({...keys,action:value})}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('log.actionBehavior')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {actions.map(a => <SelectItem value={a.value} key={a.value}>{a.name}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
                <div>
                    <Button className="mr-3 px-6" onClick={handleSearch}>
                        {t('log.searchButton')}
                    </Button>
                    <Button variant="outline" className="px-6" onClick={handleReset}>
                        {t('log.resetButton')}
                    </Button>
                </div>
            </div>
            <Table className="mb-[50px]">
                {/* <TableCaption>用户列表.</TableCaption> */}
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px]">{t('log.auditId')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.username')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.operationTime')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.systemModule')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.operationAction')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.objectType')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.operationObject')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.ipAddress')}</TableHead>
                        <TableHead className="w-[200px]">{t('log.remark')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map(log => (
                    <TableRow>
                        <TableCell className="font-medium max-w-md truncate">{log.id}</TableCell>
                        <TableCell>{log.operator_name}</TableCell>
                        <TableCell>{log.create_time}</TableCell>
                        <TableCell>{log.system_ids}</TableCell>
                        <TableCell>{log.event_type}</TableCell>
                        <TableCell>{log.object_type}</TableCell>
                        <TableCell>{log.object_name}</TableCell>
                        <TableCell>{log.ip_address}</TableCell>
                        <TableCell>{log.note}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        {/* 分页 */}
        {/* <Pagination count={10}></Pagination> */}
        <div className="bisheng-table-footer">
            <p className="desc pl-4">{t('log.auditManagement')}</p>
            <AutoPagination
                className="float-right justify-end w-full mr-6"
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={(newPage) => setPage(newPage)}
            />
        </div>
    </div>
};


const useUsers = () => {
    const pageRef = useRef(1)
    const [users, setUsers] = useState<any[]>([]);

    const reload = (page, name) => {
        getUsersApi({ name, page, pageSize: 60 }).then(res => {
            pageRef.current = page
            const opts = res.data.map(el => ({ label: el.user_name, value: el.user_id }))
            setUsers(_ops => page > 1 ? [..._ops, ...opts] : opts)
        })
    }

    // 加载更多
    const loadMore = (name) => {
        reload(pageRef.current + 1, name)
    }

    return {
        users,
        loadMore,
        reload() {
            reload(1, '')
        },
        searchUser(name) {
            reload(1, name)
        }
    }
}