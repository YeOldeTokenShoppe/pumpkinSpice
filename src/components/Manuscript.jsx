import React from 'react';
import styles from './Manuscript.module.css';

const Manuscript = ({ 
  title = "Manuscriptus", 
  content, 
  blockquote,
  showDefaultContent = true 
}) => {
  const defaultContent = {
    firstParagraph: "In the dim glow of the crescent moon, ye shall turn to the herbs that bend by starlit rivers, for there lies virtue unmatched. Take ye the stalk of the green-fire leaf, touched by night's breath, and therein distill the elixir of the heart's rekindling. Whisper o'er the potion the words known only to the ancients, that the ether may weave its strands, and the spirit be drawn to gentle slumber. Beware, for the root that dances like silver under the sun's gaze may hide shadows in darkened hours. Let not the unwary hand reach, lest the dark humors take hold, for nature's balance is as fickle as the stars that move overhead.",
    blockquote: "The leaf of the moonblossom, pale as ghostly dew, holds the secret to unclouded vision—but heed the wisdom of the ancients, for sight beyond sight comes with a shadowed price.",
    secondParagraph: "Beneath the skies where the winds do sigh in quiet murmurs, one may find the leaf of the moonblossom—pale as ghostly dew upon first light. Pluck it with reverence, for its petals carry the knowledge of the night's whispers, a potion for the vision unclouded. When brewed with the sap of the ancient yew, it may grant sight beyond sight, yet take heed, for in the overreach lies peril. The ancients tell: as light reveals, so too does it conceal, and those who gaze too deep may find themselves adrift, unmoored from the waking world."
  };

  const displayContent = showDefaultContent && !content ? defaultContent : { 
    firstParagraph: content?.firstParagraph || '', 
    blockquote: blockquote || content?.blockquote || '',
    secondParagraph: content?.secondParagraph || ''
  };

  return (
    <div className={styles.manuscript}>
      <h1>{title}</h1>
      {displayContent.firstParagraph && (
        <p>{displayContent.firstParagraph}</p>
      )}
      {displayContent.blockquote && (
        <blockquote>
          <p>
            <span className={styles.dropcap}>
              {displayContent.blockquote.charAt(0)}
            </span>
            {displayContent.blockquote.slice(1)}
          </p>
        </blockquote>
      )}
      {displayContent.secondParagraph && (
        <p>{displayContent.secondParagraph}</p>
      )}
    </div>
  );
};

export default Manuscript;