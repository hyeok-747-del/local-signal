export type TrendData={source:string;startDate:string;endDate:string;timeUnit:string;metric:string;warning:string;results:{title:string;keywords:string[];data:{period:string;ratio:number}[]}[]};
export type Review={id:string;business:string;text:string;createdAt:string;source:'직접 입력'|'CSV';demo:boolean};
export type KeywordGroup={groupName:string;keywords:string[]};
