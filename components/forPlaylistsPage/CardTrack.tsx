import { trackItem } from "../../lib/types";

interface ModalCardTrackProps {
  track: trackItem;
}

const ExplicitSign: React.FC = () => {
  return (
    <div>
      <span>E</span>
      <style jsx>{`
        span {
          font-size: 10px;
          font-weight: bold;
          color: #463f3f;
          font-family: "Lato", sans-serif;
        }
        div {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
          background-color: #d2d2d2;
          width: 17px;
          height: 17px;
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

const ModalCardTrack: React.FC<ModalCardTrackProps> = ({ track }) => {
  return (
    <article>
      <a href={track.href} target="_blank" rel="noopener noreferrer">
        {track.images ? (
          <img src={track.images[2]?.url ?? track.images[1]?.url} alt="" />
        ) : null}
        <section>
          <strong>{`${track.name}`}</strong>
          <div>
            {track.explicit && <ExplicitSign />}
            <p>{track.artists}</p>
          </div>
        </section>
      </a>
      <style jsx>{`
        div {
          display: flex;
          align-items: center;
        }
        p {
          margin: 0;
          font-weight: 400;
          font-size: 16px;
        }
        strong {
          font-size: 18px;
          font-weight: bold;
        }
        a {
          width: 610px;
          height: 65px;
          background-color: #151414;
          border-radius: 10px;
          margin: 0;
          padding: 0;
          display: flex;
          margin-bottom: 10px;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        img {
          margin: 0;
          padding: 0;
          border-radius: 10px 0 0 10px;
          margin-right: 23px;
        }
      `}</style>
    </article>
  );
};

export default ModalCardTrack;
