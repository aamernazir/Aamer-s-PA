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
   data={'messages':[{'id':i,'threadId':'thread-'+i} for i in ids]}
  else:
   mid=url.split('/messages/')[1].split('?')[0];detail_ids.append(mid)
   subject='Paper accepted for publication' if mid=='b' else 'Manuscript '+mid
   body=b'<p>The journal accepted this paper for publication. This completed research outcome can be archived.</p>' if mid=='b' else b'<p>Review deadline November 15, 2026.</p><img src="https://tracking.invalid/pixel" onerror="window.emailExecuted=true"><script>window.emailExecuted=true</script>'
   data={'id':mid,'threadId':'thread-'+mid,'internalDate':'1790899200000','payload':{'headers':[{'name':'Subject','value':subject},{'name':'From','value':'editor@example.test'}],'mimeType':'text/html','body':{'data':base64.urlsafe_b64encode(body).decode()}}}
  route.fulfill(status=200,content_type='application/json',body=json.dumps(data))
 page.route('https://gmail.googleapis.com/**',gmail)
 page.goto(os.environ.get('MAILBOX_TEST_URL', 'http://127.0.0.1:5173/Aamer-s-PA/'))
 page.get_by_role('heading',name='Mailbox',exact=True).click()
 panel=page.get_by_role('region',name='Mailbox scan controls')
 panel.get_by_role('button',name='Scan Gmail',exact=True).wait_for()
 page.wait_for_timeout(300)
 assert not calls, calls
 assert panel.get_by_role('button',name='1 year',exact=True).get_attribute('aria-pressed')=='true'
 assert panel.get_by_label('Mailbox scope').input_value()=='focused'
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 panel.get_by_role('status').filter(has_text='Completed').filter(has_text='1 analyzed · 0 auto-excluded · 0 older conversation messages hidden · 0 skipped · 1 with deadlines').wait_for()
 assert detail_ids==['a']
 assert 'category%3Aprimary' in calls[0]
 assert 'manuscript' in calls[0]
 assert panel.get_by_role('button',name='1 year',exact=True).get_attribute('aria-pressed')=='true'
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 panel.get_by_role('status').filter(has_text='Completed').filter(has_text='1 analyzed · 0 auto-excluded · 0 older conversation messages hidden · 1 skipped · 0 with deadlines').wait_for()
 assert detail_ids==['a','b'],detail_ids
 article_b=page.locator('article').filter(has_text='Paper accepted for publication')
 article_b.get_by_role('button',name='Review transfer to Research Intelligence',exact=True).click()
 dialog=page.get_by_role('dialog',name='Review transfer')
 dialog.get_by_text('This is the complete record that will be transferred',exact=False).wait_for()
 dialog.get_by_label('Contribution / outcome summary').fill('The journal accepted the completed paper for publication; retain this as a reviewable research output.')
 dialog.get_by_role('button',name='Confirm and save',exact=True).click()
 page.get_by_text('Transferred to Research Intelligence as a reviewable record.',exact=True).wait_for()
 archive=page.evaluate('JSON.parse(window.testRecords["am2r-publication-archive-v1"])')
 assert archive['outputs'][0]['summary'].startswith('The journal accepted')
 assert archive['outputs'][0]['needsReview'] is True
 article_a=page.locator('article').filter(has_text='Manuscript a')
 article_a.get_by_role('button',name='Keep · relevant',exact=True).click()
 article_a.get_by_text('Kept',exact=True).wait_for()
 article_a.get_by_role('button',name='Ignore',exact=True).click()
 article_a.wait_for(state='detached')
 page.get_by_role('button',name='Ignored 1',exact=True).click()
 page.get_by_role('button',name='Clear ignored list',exact=True).click()
 page.get_by_role('button',name='Confirm clear 1',exact=True).click()
 page.get_by_text('1 ignored record cleared.',exact=False).wait_for()
 page.get_by_role('button',name='Active messages 1',exact=True).click()
 panel.get_by_role('button',name='Custom dates',exact=True).click()
 panel.get_by_label('Start date (UTC)',exact=True).fill('2026-10-02')
 panel.get_by_label('End date (UTC, inclusive)').fill('2026-01-01')
 before=len(calls)
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 page.get_by_role('alert').filter(has_text='Choose a valid start').wait_for()
 assert len(calls)==before
 panel.get_by_label('End date (UTC, inclusive)').fill('2026-10-02')
 panel.get_by_label('Force rescan').check()
 panel.get_by_role('button',name='Scan Gmail',exact=True).click()
 panel.get_by_role('status').filter(has_text='Completed').filter(has_text='2 analyzed · 0 auto-excluded · 0 older conversation messages hidden · 0 skipped · 1 with deadlines').wait_for()
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
 assert panel.get_by_role('button',name='New mail',exact=True).get_attribute('aria-pressed')=='true'
 before=len(calls);page.wait_for_timeout(300);assert len(calls)==before
 assert not remote_images,remote_images
 assert not page.evaluate('window.emailExecuted || false')
 assert not errors,errors
 print('PASS: Focused Primary scan; keep/ignore/bulk clear; editable transfer preview; real reviewable module record; duplicate-safe routing; bounded summary without body/attachments; failure recovery; reload')
 browser.close()
