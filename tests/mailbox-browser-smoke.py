"""Run against Vite with Python Playwright and Chromium; all Gmail/auth data is simulated."""
import json, base64, os
from playwright.sync_api import sync_playwright
mock = '''
const user={uid:'test-owner',email:'owner@example.test'};
const records=JSON.parse(sessionStorage.getItem('test-records')||'{}');
export const cloudStorage={
 hasLegacyData:async()=>false,
 getStatus:()=>({user, sync:{pending:0, conflicts:[], errors:[], blocked:false}}),
 subscribe(fn){fn(this.getStatus());return ()=>{}}, waitForAuth:async()=>{},
 get:async key=>records[key]?{value:records[key]}:null,
 set:async(key,value)=>{if(window.failSave)throw Error('Simulated storage failure');records[key]=value;sessionStorage.setItem('test-records',JSON.stringify(records));},
 delete:async()=>{},list:async()=>({keys:[]}),
 getGmailAccessToken:()=> 'test-token',getGmailAccountEmail:()=> 'owner@example.test',isGmailConnected:()=>true,
 connectGmailReadonly:async()=>{},isSignedIn:()=>true,
};
window.testRecords=records;
'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
 page=browser.new_page()
 errors=[]; calls=[]; detail_ids=[]; remote_images=[]
 page.route('https://tracking.invalid/**',lambda route:(remote_images.append(route.request.url),route.abort()))
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.route('**/src/cloud-storage.js',lambda route:route.fulfill(status=200,content_type='text/javascript',body=mock))
 def gmail(route):
  url=route.request.url;calls.append(url)
  if '/messages?' in url:
   ids=['a','b'] if len(detail_ids) else ['a']
   data={'messages':[{'id':i,'threadId':'thread-1'} for i in ids]}
  else:
   mid=url.split('/messages/')[1].split('?')[0];detail_ids.append(mid)
   data={'id':mid,'threadId':'thread-1','internalDate':'1790899200000','payload':{'headers':[{'name':'Subject','value':'Manuscript '+mid},{'name':'From','value':'editor@example.test'}],'mimeType':'text/html','body':{'data':base64.urlsafe_b64encode(b'<p>Review deadline November 15, 2026.</p><img src="https://tracking.invalid/pixel" onerror="window.emailExecuted=true"><script>window.emailExecuted=true</script>' ).decode()}}}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 page.route('https://gmail.googleapis.com/**',gmail)
 page.goto(os.environ.get('MAILBOX_TEST_URL', 'http://127.0.0.1:5173/Aamer-s-PA/'))
 page.get_by_role('heading',name='Mailbox',exact=True).click()
 panel=page.get_by_role('region',name='Mailbox scan controls')
 panel.get_by_role('button',name='Scan Gmail',exact=True).wait_for()
 page.wait_for_timeout(300)
 assert not calls, calls
 assert panel.get_by_label('Look back (months)').input_value()=='12'
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 page.get_by_text('Scan saved: 1 analyzed, 0 skipped, 1 with deadlines, 0 failed.',exact=True).wait_for()
 assert detail_ids==['a']
 assert panel.get_by_label('Scan type').input_value()=='incremental'
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 page.get_by_text('Scan saved: 1 analyzed, 1 skipped, 1 with deadlines, 0 failed.',exact=True).wait_for()
 assert detail_ids==['a','b'],detail_ids
 assert page.get_by_text('Manuscript b',exact=True).count()==1
 panel.get_by_label('Scan type').select_option('manual')
 panel.get_by_label('Start date (UTC)',exact=True).fill('2026-10-02')
 panel.get_by_label('End date (UTC, inclusive)').fill('2026-01-01')
 before=len(calls)
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 page.get_by_role('status').filter(has_text='Choose a valid start').wait_for()
 assert len(calls)==before
 panel.get_by_label('End date (UTC, inclusive)').fill('2026-10-02')
 panel.get_by_label('Force rescan').check()
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 page.get_by_text('Scan saved: 2 analyzed, 0 skipped, 2 with deadlines, 0 failed.',exact=True).wait_for()
 assert detail_ids==['a','b','a','b'],detail_ids
 panel.get_by_text('Scan history (3)',exact=True).click()
 assert panel.get_by_role('row').count()==4
 state=page.evaluate('JSON.parse(window.testRecords["an2r-gmail-deadlines-v1"])')
 assert len(state['items'])==2
 assert 'payload' not in json.dumps(state) and '<p>' not in json.dumps(state) and 'test-token' not in json.dumps(state)
 page.evaluate('window.failSave=true')
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 page.get_by_text('Simulated storage failure',exact=True).wait_for()
 assert page.evaluate('JSON.parse(window.testRecords["an2r-gmail-deadlines-v1"]).history.length')==3
 page.reload()
 page.get_by_role('heading',name='Mailbox',exact=True).click()
 panel=page.get_by_role('region',name='Mailbox scan controls')
 panel.get_by_text('Scan history (3)',exact=True).wait_for()
 assert panel.get_by_label('Scan type').input_value()=='incremental'
 before=len(calls);page.wait_for_timeout(300);assert len(calls)==before
 assert not remote_images,remote_images
 assert not page.evaluate('window.emailExecuted || false')
 assert not errors,errors
 print('PASS: full Mailbox UI; no automatic scans; default 12 months; incremental new-thread replies; inclusive manual range; force rescan; history; metadata-only persistence; storage failure; reload')
 browser.close()
