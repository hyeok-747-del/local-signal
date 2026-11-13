import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoBusinesses,filterBusinesses,toggleId,isBusiness} from '../src/lib/business.ts';
import {regions} from '../src/lib/regions.ts';
test('전국 17개 시도와 구 종속 데이터',()=>{assert.equal(Object.keys(regions).length,17);assert.ok(regions['대구광역시'].includes('군위군'));assert.deepEqual(regions['세종특별자치시'],[]);});
test('시도 전체, 구, 업종 및 빈 결과 필터',()=>{assert.equal(filterBusinesses(demoBusinesses,'서울특별시','','').length,24);assert.equal(filterBusinesses(demoBusinesses,'서울특별시','마포구','카페').length,2);assert.equal(filterBusinesses(demoBusinesses,'부산광역시','','').length,0);assert.equal(filterBusinesses(demoBusinesses,'서울특별시','','  카페  ').length,8);});
test('선택 개수 제한 없이 추가 및 해제',()=>{let ids:string[]=[];for(let i=0;i<150;i++)ids=toggleId(ids,String(i));assert.equal(ids.length,150);ids=toggleId(ids,'12');assert.equal(ids.length,149);assert.ok(!ids.includes('12'));});
test('손상된 저장 업체 거부',()=>{assert.ok(isBusiness(demoBusinesses[0]));assert.ok(!isBusiness({id:1}));assert.ok(!isBusiness(null));});
