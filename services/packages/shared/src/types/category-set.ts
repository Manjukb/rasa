export type CategorySet = {
    [key: string]: {
        id: string;
        name: string;
        child_id?: string;
        child_name?: string;
        child_parent_id?: string;
    }[];
};
