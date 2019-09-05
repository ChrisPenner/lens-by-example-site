import React from 'react';
import {Link} from 'react-router-dom'

import MailingListForm from './MailingListForm'
import groupBy from "lodash.groupby"
import ReactHover from 'react-hover'
import { FirestoreCollection } from 'react-firestore'

const sortArticles = as => groupBy(as, a => a.section)
const options = {
  followCursor:false,
  shiftX: 0,
  shiftY: 0
}

const HoverDescription = ({what, why}) => <div className="hover-card">
    <div><b>{what}</b></div>
    <p>{why}</p>
</div>


const buildArticleLink =
    ({title, url, what, why}) =>
    <ReactHover
        key={url}
        options={options}>
        <ReactHover.Trigger type='trigger'>
            <li key={url}><Link to={url}>{ title }</Link></li>
        </ReactHover.Trigger>
        <ReactHover.Hover type='hover'>
            <HoverDescription what={what} why={why} />
        </ReactHover.Hover>
    </ReactHover>

const buildSection = ([section, as]) =>
        <li key={section}> {section}
            <ol type="i">
                {as.map(buildArticleLink)}
            </ol>
        </li>

export default () => <FirestoreCollection
  path="posts"
  render={({ isLoading, data }) => {
      if (isLoading) {
          return ( <div> Loading... </div>)
      }
      const articleList = Object.entries(sortArticles(data)).map(buildSection)
      return (<div>
          <section className="section">
              <h1 className="subtitle">Sections</h1>
              <div className="content">
                  <ol type="1">
                      {articleList}
                  </ol>
              </div>
          </section>
          <MailingListForm />
      </div>)
  }}
/>

