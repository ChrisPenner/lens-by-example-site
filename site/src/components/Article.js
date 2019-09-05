import React from 'react';

import PatreonButton from './PatreonButton'
import { FirestoreDocument } from 'react-firestore'

export default ({match}) => (
    <FirestoreDocument
        path={`posts/${match.params.slug}`}
        render={({ isLoading, data }) => {
            if (isLoading) {
                return <div> Loading... </div>
            }
            console.log(data)
            if (!data.slug) {
                return <div> couldn't find article: {match.params.slug}</div>
            }
            return (
            <article className="section content"> 
                <div dangerouslySetInnerHTML={{__html: data.content}}>
                </div>
                <br/>
                <p>Hopefully you learned something! If so, please consider supporting more posts like this by pledging on my <a href="https://www.patreon.com/bePatron?u=7263362">Patreon page</a>! It takes quite a bit of work to put these things together, if I saved you some time consider supporting the community by sending a few bucks my way for a coffee or two!</p>
                <div className="centered"> <PatreonButton /></div>
            </article>
            );
        }}
    />)
