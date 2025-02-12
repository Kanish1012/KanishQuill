import AnimationWrapper from "../common/page-animation";

const NoDataMessage = ({ message }) => {
    return (
        <AnimationWrapper>
            <div className="text-center w-full p-4 rounded-full bg-grey/50 mt-4">
                <p>{message}</p>
            </div>
        </AnimationWrapper>
    );
};

export default NoDataMessage;
